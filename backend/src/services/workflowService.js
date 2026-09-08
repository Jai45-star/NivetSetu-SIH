import { ApplicationService as Store } from './applicationService.js';
import { normalizeWorkflow, event } from './workflowState.js';
import { calculateSLA, bottleneck } from './slaService.js';
import { OFFICER, DAY } from '../rules/slaPolicies.js';
import { httpError } from '../utils/validationHelpers.js';
import { buildValidationReport } from './applicationValidationService.js';
import { governmentAdapter } from '../integrations/mockGovernmentAdapter.js';
import { randomUUID } from 'node:crypto';
export const QUERY_TYPES = ['Document Clarification', 'Information Mismatch', 'Additional Information', 'Other'];
const terminal = a => ['approved', 'rejected'].includes(a.status);
const migrations = new Map();
let pendingList;
function required(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw httpError(400, `${label} is required (maximum 4,000 characters).`);
  return value.trim();
}
export function trackingView(app, officer = false, now = new Date()) {
  const a = normalizeWorkflow(structuredClone(app));
  if (!a.workflow) return a;
  const current = a.workflow.stages.find(s => s.stageId === a.workflow.currentStage);
  const sla = calculateSLA(current, now);
  const signals = bottleneck(a, sla, now);
  if (!officer) {
    delete a.internalNotes;
    a.workflowEvents = a.workflowEvents.filter(e => !e.internal);
  }
  return { ...a, sla, ...signals, integrationLabel: governmentAdapter.label,
    processingDays: (new Date(a.decidedAt || now) - new Date(a.submittedAt || a.createdAt)) / DAY };
}
export async function getTracking(id, officer = false) {
  let a = await Store.requireApplication(id);
  if (!a.workflow && !['draft', 'ready_for_validation'].includes(a.status)) {
    if (!migrations.has(id)) migrations.set(id, Store.withLock(id, async () => { const latest = await Store.requireApplication(id); return latest.workflow ? latest : Store.save(latest, normalizeWorkflow(latest)); }).finally(() => migrations.delete(id)));
    a = await migrations.get(id);
  }
  return trackingView(a, officer);
}
export async function officerAction(id, action, body = {}) {
  if (body.remark !== undefined && typeof body.remark !== 'string') throw httpError(400, 'Remark must be text.');
  return Store.withLock(id, async () => {
    const original = await Store.requireApplication(id);
    const a = normalizeWorkflow(original);
    if (!a.workflow) throw httpError(409, 'Only submitted applications can enter officer review.');
    if (action === 'approve' && a.status === 'approved' || action === 'reject' && a.status === 'rejected') return trackingView(a, true);
    if (terminal(a)) throw httpError(409, 'A final decision has already been recorded.');
    const w = a.workflow;
    const index = w.stages.findIndex(s => s.stageId === w.currentStage);
    const stage = w.stages[index];
    const now = new Date();
    const addEvent = (type, details) => a.workflowEvents.push(event(type, OFFICER, details, now));
    if (action === 'start-review' && index > 0) return trackingView(a, true);
    if (w.applicantActionRequired) throw httpError(409, 'Wait for the applicant response before continuing review.');
    if (action === 'start-review' || action === 'advance-stage') {
      if (action === 'start-review' && index !== 0 || action === 'advance-stage' && (index < 1 || index >= 3)) throw httpError(409, 'This stage cannot be advanced.');
      if (action === 'advance-stage' && body.expectedStage !== w.currentStage) throw httpError(409, 'Stage changed or expectedStage missing. Refresh before advancing.');
      stage.status = 'completed'; stage.completedAt = now;
      const next = w.stages[index + 1]; next.status = 'in_progress'; next.startedAt = now; next.officer = OFFICER;
      w.currentStage = next.stageId; w.currentStageStartedAt = now; a.currentStage = next.name; a.status = 'under_review';
      addEvent(action === 'start-review' ? 'REVIEW_STARTED' : 'STAGE_CHANGED', { before: stage.name, after: next.name, message: `${stage.name} completed. ${next.name} started.`, remark: body.remark?.slice(0, 4000) });
    } else if (action === 'query') {
      if (!index) throw httpError(409, 'Start review before raising a query.');
      if (!QUERY_TYPES.includes(body.type)) throw httpError(400, 'Select a valid query type.');
      if (body.documentId && !a.documents.some(d => d.documentId === body.documentId)) throw httpError(400, 'Unknown requested document.');
      const q = { queryId: randomUUID(), type: body.type, message: required(body.message, 'Query message'), documentId: body.documentId || null,
        avoidableError: body.avoidableError === true, requiresUpload: body.requiresUpload === true, createdAt: now, status: 'open', officer: OFFICER };
      if (q.requiresUpload && !q.documentId) throw httpError(400, 'Select the requested document when an upload is required.');
      a.queries.push(q); a.queryCount = a.queries.length; a.status = 'action_required'; w.applicantActionRequired = true; w.applicantActionReason = q.message; stage.slaPausedAt = now;
      addEvent('QUERY_RAISED', { queryId: q.queryId, message: q.message, documentId: q.documentId });
    } else if (action === 'approve' || action === 'reject') {
      if (index !== 3) throw httpError(409, 'A decision is only allowed at Final Decision.');
      if (action === 'reject') { a.rejection = { category: required(body.category, 'Reason category'), reason: required(body.reason, 'Detailed rejection reason') }; }
      if (action === 'approve' && a.validationStatus !== 'passed') throw httpError(409, 'Pre-validation must pass before prototype approval.');
      stage.status = 'completed'; stage.completedAt = now; a.status = action === 'approve' ? 'approved' : 'rejected'; a.decidedAt = now;
      addEvent(action === 'approve' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED', { message: action === 'approve' ? 'Prototype approval recorded.' : a.rejection.reason, remark: body.remark?.slice(0, 4000), category: a.rejection?.category });
    } else if (action === 'note') {
      a.internalNotes = [...(a.internalNotes || []), { text: required(body.message, 'Internal note'), at: now, actor: OFFICER }];
      addEvent('INTERNAL_NOTE_ADDED', { internal: true, message: 'Internal note recorded.' });
    } else throw httpError(404, 'Unknown officer action');
    w.lastOfficerActionAt = now;
    a.integration = { ...a.integration, ...governmentAdapter.pushStatusUpdate(a) };
    return trackingView(await Store.save(original, a), true);
  });
}
export async function replaceQueryDocument(id, queryId, documentId, fileData) {
  return Store.withLock(id, async () => {
    const a = await Store.requireApplication(id);
    const q = a.queries?.find(q => q.queryId === queryId && q.status === 'open');
    if (!q || !a.workflow?.applicantActionRequired || q.documentId !== documentId) throw httpError(409, 'Only the document requested by the active query may be replaced.');
    const old = a.documents.find(d => d.documentId === documentId);
    const documents = a.documents.map(d => d.documentId === documentId ? { ...d, ...fileData, uploadedAt: new Date(), extraction: null, validation: null, status: 'uploaded' } : d);
    const checked = await buildValidationReport({ ...a, documents });
    q.uploadedAt = new Date();
    // Retain the original file for audit traceability; it is no longer served as the current document.
    const workflowEvents = [...a.workflowEvents, event('APPLICANT_DOCUMENT_REPLACED', { id: a.userId, name: 'Applicant' }, { queryId, documentId, before: old.originalName, after: fileData.originalName, previousStoredName: old.storedName, message: `Requested document replaced: ${old.name}` })];
    return trackingView(await Store.save(a, { documents: checked.documents, validationReport: checked.report, validationStatus: checked.report.readiness.ready ? 'passed' : 'issues', readinessScore: checked.report.readiness.score, validatedAt: checked.report.validatedAt, queries: a.queries, workflowEvents }));
  });
}
export async function respondToQuery(id, body) {
  return Store.withLock(id, async () => {
    const a = await Store.requireApplication(id);
    const q = a.queries?.find(q => q.queryId === body.queryId);
    if (!q) throw httpError(404, 'Query not found.');
    if (q.status === 'responded') return trackingView(a);
    if (!a.workflow?.applicantActionRequired) throw httpError(409, 'No applicant response is pending.');
    const response = required(body.response, 'Response');
    if (q.requiresUpload && !q.uploadedAt) throw httpError(409, 'Upload the requested document before responding.');
    const { documents, report } = await buildValidationReport(a);
    if (!report.readiness.ready) throw httpError(409, 'Resolve validation issues in the requested document before responding.');
    const now = new Date(); q.response = response; q.respondedAt = now; q.status = 'responded';
    const stage = a.workflow.stages.find(s => s.stageId === a.workflow.currentStage);
    stage.slaPausedDuration = (stage.slaPausedDuration || 0) + Math.max(0, now - new Date(stage.slaPausedAt)); stage.slaPausedAt = null;
    a.workflow.applicantActionRequired = false; a.workflow.applicantActionReason = null;
    return trackingView(await Store.save(a, { status: 'under_review', workflow: a.workflow, queries: a.queries, documents, validationReport: report, validationStatus: 'passed', readinessScore: report.readiness.score, validatedAt: now,
      workflowEvents: [...a.workflowEvents, event('QUERY_RESPONDED', { id: a.userId, name: 'Applicant' }, { queryId: q.queryId, message: response }, now)] }));
  });
}
export async function listOfficerApplications() {
  if (!pendingList) pendingList = loadOfficerApplications().finally(() => { pendingList = null; });
  return structuredClone(await pendingList);
}
async function loadOfficerApplications() {
  const all = await Store.listAllApplications();
  const applications = [];
  for (const app of all.filter(a => !['draft', 'ready_for_validation'].includes(a.status))) {
    let a = await getTracking(app.applicationId, true);
    if (!terminal(a) && !a.sla?.paused && ['AT_RISK', 'BREACHED'].includes(a.sla?.slaStatus)) {
      const type = a.sla.slaStatus === 'BREACHED' ? 'SLA_BREACHED' : 'SLA_WARNING';
      const key = `${a.workflow.currentStage}:${type}`;
      if (!a.workflowEvents.some(e => e.signalKey === key)) {
        await Store.withLock(a.applicationId, async () => { const current = await Store.requireApplication(a.applicationId); if (!current.workflowEvents.some(e => e.signalKey === key)) await Store.save(current, { workflowEvents: [...current.workflowEvents, event(type, { id: 'system', name: 'Prototype system' }, { signalKey: key, message: a.bottleneckReason })] }); });
        a = await getTracking(app.applicationId, true);
      }
    }
    applications.push(a);
  }
  const rank = a => terminal(a) ? 5 : a.sla?.paused ? 4 : ({ BREACHED: 0, AT_RISK: 1, ATTENTION: 2, SAFE: 3 }[a.sla?.slaStatus] ?? 3);
  return applications.sort((a, b) => rank(a) - rank(b) || (a.sla?.remainingDays ?? 0) - (b.sla?.remainingDays ?? 0));
}
export function analytics(applications) {
  const completed = applications.filter(terminal);
  const times = applications.filter(a => !a.legacyWorkflow).flatMap(a => a.workflow.stages.filter(s => s.completedAt && s.startedAt).map(s => calculateSLA(s).elapsedDays));
  return { total: applications.length, underReview: applications.filter(a => a.status === 'under_review' || a.status === 'at_risk').length,
    applicantPending: applications.filter(a => a.workflow.applicantActionRequired).length,
    needsAttention: applications.filter(a => !terminal(a) && !a.sla?.paused && ['ATTENTION', 'AT_RISK', 'BREACHED'].includes(a.sla?.slaStatus)).length,
    breaches: applications.filter(a => a.workflow.stages.some(s => calculateSLA(s)?.slaStatus === 'BREACHED')).length,
    processed: completed.length, averageStageDays: times.length ? times.reduce((a,b) => a+b, 0) / times.length : null,
    averageQueryCycles: applications.length ? applications.reduce((n,a) => n + (a.queryCount || 0), 0) / applications.length : null,
    firstTimeRightRate: completed.length ? 100 * completed.filter(a => a.preValidationPassedAtSubmission && !a.queries.some(q => q.avoidableError)).length / completed.length : null };
}
