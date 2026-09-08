export const VALIDATION_VERSION = 'phase3-1';
export function issue(document, code, severity, title, message, action, extra = {}) {
  return { code, severity, documentType: document?.documentType || 'application', documentId: document?.documentId || null,
    documentName: document?.name || 'Application', title, message, field: null, detectedValue: null, expected: null,
    confidence: 'high', action, ...extra };
}
export function validationState(issues) {
  if (issues.some(i => i.severity === 'error')) return 'invalid';
  if (issues.some(i => i.severity === 'manual_review')) return 'manual_review';
  if (issues.some(i => i.severity === 'warning')) return 'warning';
  return 'valid';
}
export function httpError(status, message) { return Object.assign(new Error(message), { status }); }
export function utcDay(date = new Date()) { return date.toISOString().slice(0, 10); }
