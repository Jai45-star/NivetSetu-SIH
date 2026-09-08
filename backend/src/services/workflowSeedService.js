import { ApplicationService as Store } from './applicationService.js';
import { initializeWorkflow } from './workflowState.js';
import { officerAction } from './workflowService.js';
import { validateApplication } from './applicationValidationService.js';
import { StorageService } from './storageService.js';
import { demoPdf, fixtureLines, demoProfile } from '../../fixtures/demoPdf.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { DAY } from '../rules/slaPolicies.js';
export async function seedWorkflow() {
  if (process.env.NODE_ENV === 'production') throw new Error('Workflow fixtures are development-only.');
  const results = [];
  for (const [scenario, industry] of [['normal', 'Food Processing'], ['query', 'Textile'], ['risk', 'Chemical'], ['breach', 'Food Processing'], ['approved', 'Food Processing'], ['rejected', 'Textile']]) {
    let a = await Store.createDraft('demo-entrepreneur-001', { unitName: `${industry} Unit · ${scenario} demo`, businessProfile: { ...demoProfile, industryType: industry } });
    for (const d of a.documents) {
      const bytes = demoPdf(fixtureLines(d.documentType)); const storedName = `workflow-${randomUUID()}.pdf`;
      await fs.writeFile(StorageService.getFilePath(storedName), bytes);
      a = await Store.attachDocument(a.applicationId, d.documentId, { storedName, originalName: `${d.documentId}-demo.pdf`, mimeType: 'application/pdf', size: bytes.length });
    }
    a = await validateApplication(a.applicationId);
    if (a.validationStatus !== 'passed') throw new Error(`Fixture ${scenario} did not pass real pre-validation.`);
    a = await Store.submitApplication(a.applicationId);
    a = await officerAction(a.applicationId, 'start-review');
    if (scenario === 'query') a = await officerAction(a.applicationId, 'query', { type: 'Document Clarification', message: 'Please provide updated ownership proof.', documentId: a.documents.find(d => d.documentType === 'ownership_lease').documentId, requiresUpload: true, avoidableError: true });
    if (['risk', 'breach', 'approved', 'rejected'].includes(scenario)) a = await officerAction(a.applicationId, 'advance-stage', { expectedStage: 'documents' });
    if (['approved', 'rejected'].includes(scenario)) { a = await officerAction(a.applicationId, 'advance-stage', { expectedStage: 'technical' }); }
    if (scenario === 'approved') { a = await officerAction(a.applicationId, 'approve', { remark: 'Cleaner application means less repetitive scrutiny. Prototype approval only.' }); }
    if (scenario === 'rejected') { a = await officerAction(a.applicationId, 'reject', { category: 'Documentation', reason: 'Ownership proof could not be verified against submitted business profile. Please re-apply with notarized documentation.', remark: 'Documents reviewed; lease agreement mismatch found.' }); }
    if (scenario === 'risk' || scenario === 'breach') {
      const age = scenario === 'risk' ? 9 : 12;
      const now = Date.now(); const submittedAt = new Date(now - (age + 2) * DAY);
      const workflow = initializeWorkflow(a, submittedAt).workflow;
      workflow.stages[0].completedAt = new Date(now - (age + 1) * DAY); workflow.stages[0].status = 'completed';
      workflow.stages[1].startedAt = workflow.stages[0].completedAt; workflow.stages[1].completedAt = new Date(now - age * DAY); workflow.stages[1].status = 'completed';
      workflow.stages[2].startedAt = workflow.stages[1].completedAt; workflow.stages[2].status = 'in_progress'; workflow.currentStage = 'technical'; workflow.currentStageStartedAt = workflow.stages[2].startedAt;
      // Only generated fixtures are backdated, including their audit timestamps.
      const events = a.workflowEvents.map((e,i) => ({ ...e, at: new Date(now - (age + 2 - i) * DAY) }));
      a = await Store.save(await Store.requireApplication(a.applicationId), { workflow, workflowEvents: events, submittedAt });
    }
    results.push({ scenario, applicationId: a.applicationId, url: `/entrepreneur/applications/${a.applicationId}` });
  }
  return results;
}

