import { randomUUID } from 'node:crypto';
import { STAGES, DEPARTMENT, OFFICER } from '../rules/slaPolicies.js';
export function event(type, actor, details = {}, now = new Date()) {
  return { eventId: randomUUID(), type, actor, at: now, ...details };
}
export function initializeWorkflow(application, now = new Date()) {
  const stages = STAGES.map((s, index) => ({ ...s, department: DEPARTMENT, status: index ? 'pending' : 'in_progress', startedAt: index ? null : now, completedAt: null, slaPausedDuration: 0 }));
  return { currentStage: 'Submitted', workflow: { currentStage: 'submitted', currentStageStartedAt: now, stages, applicantActionRequired: false },
    workflowEvents: [event('APPLICATION_SUBMITTED', { id: application.userId, name: 'Applicant' }, { message: 'Application submitted to the prototype workflow.' }, now)], queries: [], queryCount: 0,
    preValidationPassedAtSubmission: application.validationStatus === 'passed', assignedOfficer: OFFICER };
}
export function normalizeWorkflow(application) {
  if (application.workflow?.stages?.length || ['draft', 'ready_for_validation'].includes(application.status)) return application;
  const initial = initializeWorkflow(application, application.submittedAt || application.createdAt || new Date());
  const index = ['under_review', 'at_risk'].includes(application.status) ? 1 : ['approved', 'rejected'].includes(application.status) ? 3 : 0;
  initial.workflow.stages.forEach((s, i) => {
    if (i < index) { s.status = 'completed'; s.completedAt = application.updatedAt; }
    if (i === index) { s.status = 'in_progress'; s.startedAt = application.updatedAt || application.createdAt; }
  });
  initial.workflow.currentStage = STAGES[index].stageId;
  initial.currentStage = STAGES[index].name;
  initial.workflow.currentStageStartedAt = initial.workflow.stages[index].startedAt;
  if (['approved', 'rejected'].includes(application.status)) {
    initial.workflow.stages[index].status = 'completed';
    initial.workflow.stages[index].completedAt = application.decidedAt || application.updatedAt;
  }
  initial.workflowEvents = [event('WORKFLOW_INITIALIZED', { id: 'system', name: 'Prototype system' }, { message: 'Legacy demo record initialized. Earlier stage timings are unavailable.' })];
  initial.legacyWorkflow = true;
  return { ...application, ...initial };
}
