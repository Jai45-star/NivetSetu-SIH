import { ApplicationService } from './applicationService.js';
import { validateDocument } from './documentValidationService.js';
import { validateConsistency } from './consistencyValidationService.js';
import { calculateValidationReadiness } from './readinessService.js';
import { issue, utcDay, VALIDATION_VERSION, httpError, validationState } from '../utils/validationHelpers.js';

export async function buildValidationReport(application, options = {}) {
  const today = options.today || utcDay();
  const documents = [];
  for (const doc of application.documents || []) documents.push(await validateDocument(doc, { ...options, today, force: options.force === true || options.documentId === doc.documentId }));
  const consistency = validateConsistency(documents);
  const issues = [...documents.flatMap(d => d.validation.issues), ...consistency.issues];
  for (const doc of documents) {
    const crossIssues = consistency.issues.filter(i => i.documentId === doc.documentId);
    if (crossIssues.length) {
      doc.validation.issues.push(...crossIssues);
      doc.validation.status = validationState(doc.validation.issues);
    }
  }
  const required = ['industryType', 'location', 'investmentRange', 'employeeRange', 'businessStage'];
  for (const field of required) if (!application.businessProfile?.[field]?.trim()) issues.push(issue(null, 'PROFILE_MISSING', 'error', 'Business profile is incomplete', `Please complete ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`, 'Return to Business Profile and complete all required fields.', { field }));
  if (!documents.length) issues.push(issue(null, 'CHECKLIST_MISSING', 'error', 'Document checklist is missing', 'A required document checklist has not been generated.', 'Complete the business profile to generate requirements.'));
  const readiness = calculateValidationReadiness(documents, consistency, issues);
  return { documents, report: { title: 'NiveshSetu Pre-Validation Report', version: VALIDATION_VERSION, validationDay: today, validatedAt: new Date(),
    applicationId: application.applicationId, unitName: application.unitName, readiness, consistency, issues,
    summary: { preValidation: readiness.ready ? 'Passed' : 'Issues', checksPerformed: documents.length + consistency.total + required.length,
      errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, manualReview: issues.filter(i => i.severity === 'manual_review').length },
    ruleReferences: (application.requiredApprovals || []).map(a => ({ ruleId: a.ruleId, name: a.name, scope: 'Prototype checklist rule, not an official legal determination' })),
    disclaimer: 'Pre-submission validation readiness only. Final scrutiny and approval remain with the authorized government department.' } };
}
export async function validateApplication(id, options = {}) {
  return ApplicationService.withLock(id, async () => {
    const app = await ApplicationService.requireApplication(id);
    ApplicationService.assertEditable(app);
    if (options.documentId && !app.documents.some(d => d.documentId === options.documentId)) throw httpError(404, 'Document requirement not found');
    const { documents, report } = await buildValidationReport(app, options);
    return ApplicationService.save(app, { documents, validationReport: report, validationStatus: report.readiness.ready ? 'passed' : 'issues', validatedAt: report.validatedAt,
      readinessScore: report.readiness.score, readinessLabel: report.readiness.label });
  });
}
