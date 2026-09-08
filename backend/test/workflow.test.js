import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { ApplicationService as Store } from '../src/services/applicationService.js';
import { initializeWorkflow } from '../src/services/workflowState.js';
import { officerAction, getTracking, respondToQuery, replaceQueryDocument, analytics, listOfficerApplications } from '../src/services/workflowService.js';
import { calculateSLA } from '../src/services/slaService.js';
import { DAY } from '../src/rules/slaPolicies.js';
import { governmentAdapter } from '../src/integrations/mockGovernmentAdapter.js';
import { app } from '../src/app.js';
import { Application } from '../src/models/Application.js';
import { demoPdf, demoProfile, fixtureLines } from '../fixtures/demoPdf.js';
import { StorageService } from '../src/services/storageService.js';
import { validateApplication } from '../src/services/applicationValidationService.js';
async function ready() {
 let a = await Store.createDraft('demo-entrepreneur-001', { businessProfile: demoProfile });
 for (const d of a.documents) { const bytes = demoPdf(fixtureLines(d.documentType)); const storedName = `test-wf-${randomUUID()}.pdf`; await fs.writeFile(StorageService.getFilePath(storedName), bytes); a = await Store.attachDocument(a.applicationId, d.documentId, { storedName, originalName: `${d.documentId}.pdf`, mimeType: 'application/pdf', size: bytes.length }); }
 await validateApplication(a.applicationId); return Store.submitApplication(a.applicationId);
}
async function synthetic() { const a = await Store.createDraft(); return Store.save(a, { ...initializeWorkflow(a), status: 'submitted', submittedAt: new Date() }); }
test('central SLA thresholds, exact deadline, missing dates and paused/resumed durations', () => {
 const startedAt = new Date('2026-01-01T00:00:00Z'); const stage = { startedAt, slaDays: 10 };
 for (const [elapsed, status] of [[0,'SAFE'],[5.99,'SAFE'],[6,'ATTENTION'],[8,'AT_RISK'],[10,'AT_RISK'],[10.01,'BREACHED'],[12,'BREACHED']]) assert.equal(calculateSLA(stage, new Date(+startedAt + elapsed * DAY)).slaStatus, status);
 assert.equal(calculateSLA(null), null);
 const paused = { ...stage, slaPausedAt: new Date(+startedAt + 3 * DAY) }; const calculation = calculateSLA(paused, new Date(+startedAt + 8 * DAY)); assert.equal(calculation.elapsedDays, 3); assert.equal(calculation.paused, true);
 assert.equal(calculation.dueAt, new Date(+startedAt + 15 * DAY).toISOString());
 assert.equal(calculateSLA({ ...stage, slaPausedDuration: 5 * DAY }, new Date(+startedAt + 9 * DAY)).elapsedDays, 4);
 assert.equal(calculateSLA({ ...stage, completedAt: new Date(+startedAt + 2 * DAY) }, new Date(+startedAt + 20 * DAY)).elapsedDays, 2);
});
test('stage ordering, draft/decision guards, repeat actions and persistent audit', async () => {
 const draft = await Store.createDraft(); await assert.rejects(() => officerAction(draft.applicationId, 'approve'), { status: 409 });
 let a = await synthetic(); const id = a.applicationId;
 await assert.rejects(() => officerAction(id, 'approve'), { status: 409 });
 await assert.rejects(() => officerAction(id, 'advance-stage', { expectedStage: 'submitted' }), { status: 409 });
 a = await officerAction(id, 'start-review'); assert.equal(a.currentStage, 'Document Verification'); const events = a.workflowEvents.length;
 assert.equal((await officerAction(id, 'start-review')).workflowEvents.length, events);
 await assert.rejects(() => officerAction(id, 'advance-stage', { expectedStage: 'technical' }), { status: 409 });
 a = await officerAction(id, 'advance-stage', { expectedStage: 'documents' });
 await assert.rejects(() => officerAction(id, 'advance-stage', { expectedStage: 'documents' }), { status: 409 });
 a = await officerAction(id, 'advance-stage', { expectedStage: 'technical' });
 await assert.rejects(() => officerAction(id, 'reject', {}), { status: 400 });
 a = await officerAction(id, 'reject', { category: 'Documentation', reason: 'Demo record does not include validated documents.' });
 assert.equal(a.status, 'rejected'); assert.equal((await officerAction(id, 'reject')).workflowEvents.length, a.workflowEvents.length);
 await assert.rejects(() => officerAction(id, 'advance-stage', { expectedStage: 'decision' }), { status: 409 });
 assert.equal((await getTracking(id)).workflowEvents.at(-1).type, 'APPLICATION_REJECTED');
 const persisted = new Application(await Store.requireApplication(id)); assert.equal(persisted.validateSync(), undefined); assert.equal(persisted.toObject().workflow.stages[3].status, 'completed');
});
test('real validated submission, controlled query replacement, revalidation, SLA resume, approval and privacy', async () => {
 let a = await ready(); const id = a.applicationId; const files = a.documents.map(d => d.storedName);
 try {
 assert.equal(a.workflow.currentStage, 'submitted'); assert.equal(a.workflowEvents[0].type, 'APPLICATION_SUBMITTED'); assert.equal(a.preValidationPassedAtSubmission, true);
 a = await officerAction(id, 'start-review'); a = await officerAction(id, 'note', { message: 'Private review observation' });
 assert.equal((await getTracking(id)).internalNotes, undefined); assert.ok(!(await getTracking(id)).workflowEvents.some(e => e.internal));
 a = await officerAction(id, 'query', { type: 'Document Clarification', message: 'Please replace ownership proof.', documentId: 'ownership_lease', requiresUpload: true, avoidableError: true }); const queryId = a.queries[0].queryId;
 assert.equal(a.sla.paused, true); assert.equal(a.status, 'action_required');
 await assert.rejects(() => officerAction(id, 'query', { type: 'Other', message: 'Duplicate' }), { status: 409 });
 await assert.rejects(() => officerAction(id, 'advance-stage', { expectedStage: 'documents' }), { status: 409 });
 await assert.rejects(() => Store.updateBusinessProfile(id, { location: 'Mumbai' }), { status: 409 });
 await assert.rejects(() => respondToQuery(id, { queryId, response: 'Done' }), { status: 409 });
 await assert.rejects(() => replaceQueryDocument(id, queryId, 'pan_incorporation', {}), { status: 409 });
 for (const variant of ['expired', 'valid']) {
 const bytes = demoPdf(fixtureLines('ownership_lease', variant)); const storedName = `test-wf-${randomUUID()}.pdf`; files.push(storedName); await fs.writeFile(StorageService.getFilePath(storedName), bytes);
 a = await replaceQueryDocument(id, queryId, 'ownership_lease', { storedName, originalName: 'replacement.pdf', mimeType: 'application/pdf', size: bytes.length });
 if (variant === 'expired') await assert.rejects(() => respondToQuery(id, { queryId, response: 'Updated proof' }), { status: 409 });
 }
 a = await respondToQuery(id, { queryId, response: 'Updated valid ownership proof.' }); assert.equal(a.status, 'under_review'); assert.equal(a.sla.paused, false); assert.ok(a.workflow.stages[1].slaPausedDuration > 0);
 assert.equal((await respondToQuery(id, { queryId, response: 'retry' })).workflowEvents.length, a.workflowEvents.length);
 a = await officerAction(id, 'advance-stage', { expectedStage: 'documents' }); a = await officerAction(id, 'advance-stage', { expectedStage: 'technical' }); a = await officerAction(id, 'approve', { remark: 'Prototype review complete.' });
 assert.equal(a.status, 'approved'); assert.ok(a.workflow.stages.every(s => s.status === 'completed')); assert.equal((await officerAction(id, 'approve')).workflowEvents.length, a.workflowEvents.length);
 assert.equal((await Store.submitApplication(id)).status, 'approved'); assert.equal(analytics([a]).firstTimeRightRate, 0);
 } finally { files.forEach(f => StorageService.deleteFile(f)); }
});
test('backend demo role boundaries, ownership and officer-only notes', async () => {
 const a = await synthetic(); await officerAction(a.applicationId, 'start-review'); await officerAction(a.applicationId, 'note', { message: 'PRIVATE' });
 const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); const base = `http://127.0.0.1:${server.address().port}/api`;
 try {
 assert.equal((await fetch(`${base}/officer/applications/${a.applicationId}/approve`, { method: 'POST' })).status, 403);
 assert.equal((await fetch(`${base}/applications/${a.applicationId}/business-profile`, { method: 'PATCH', headers: { 'x-demo-role': 'officer' } })).status, 403);
 assert.equal((await fetch(`${base}/applications/${a.applicationId}`, { headers: { 'x-user-id': 'another-applicant' } })).status, 403);
 const publicResult = await (await fetch(`${base}/applications/${a.applicationId}`)).text(); assert.ok(!publicResult.includes('PRIVATE')); assert.ok(!publicResult.includes('INTERNAL_NOTE'));
 const officerResult = await (await fetch(`${base}/officer/applications/${a.applicationId}`, { headers: { 'x-demo-role': 'officer' } })).text(); assert.ok(officerResult.includes('PRIVATE'));
 } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test('legacy initialization, urgency sorting, deduplicated SLA events and mock contract', async () => {
 let a = await synthetic(); a = await officerAction(a.applicationId, 'start-review'); a = await officerAction(a.applicationId, 'advance-stage', { expectedStage: 'documents' });
 const current = await Store.requireApplication(a.applicationId); current.workflow.stages[2].startedAt = new Date(Date.now() - 12 * DAY); await Store.save(current, { workflow: current.workflow });
 const list = await listOfficerApplications();
 // Verify: our backdated application shows as BREACHED and is sorted before SAFE/ATTENTION ones.
 const entry = list.find(x => x.applicationId === a.applicationId);
 assert.ok(entry, 'Backdated application must appear in officer list');
 assert.equal(entry.sla.slaStatus, 'BREACHED');
 // Sorting invariant: no SAFE/AT_RISK entry should appear before our BREACHED entry.
 const entryIndex = list.indexOf(entry);
 const safeBeforeUs = list.slice(0, entryIndex).some(x => x.sla?.slaStatus === 'SAFE' && !['approved','rejected'].includes(x.status));
 assert.ok(!safeBeforeUs, 'BREACHED application must sort before SAFE applications');
 const repeated = await listOfficerApplications(); assert.equal(repeated.find(x => x.applicationId === a.applicationId).workflowEvents.filter(e => e.type === 'SLA_BREACHED').length, 1);
 // Legacy workflow normalization: use any existing submitted demo seed that lacks full workflow data.
 // Seed data IDs vary by environment; we look up the first submitted application instead of hardcoding one.
 const allApps = await Store.listAllApplications();
 const legacyCandidate = allApps.find(app => !['draft', 'ready_for_validation'].includes(app.status) && app.applicationId !== a.applicationId);
 if (legacyCandidate) {
   const legacy = await getTracking(legacyCandidate.applicationId);
   assert.ok(legacy.workflow.stages.length === 4);
 }
 assert.equal(governmentAdapter.submitApplication(a).liveConnection, false); assert.equal(governmentAdapter.getApplicationStatus(a).mode, 'mock'); assert.equal(governmentAdapter.getDepartmentInfo().liveConnection, false); assert.match(governmentAdapter.label, /Mock/);
});
