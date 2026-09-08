import { issue } from '../utils/validationHelpers.js';
import { parseDocumentDate } from '../utils/dateParser.js';
export function requiredField(doc, fields, field, label) {
  return fields[field]?.value && fields[field].confidence !== 'low' ? [] : [issue(doc, 'FIELD_UNREADABLE', 'manual_review', `${label} needs applicant review`, `We could not confidently read the ${label.toLowerCase()}.`, 'Upload a clearer document with a readable field, or seek manual review.', { field, confidence: 'low' })];
}
export function dateChecks(doc, fields, today, { expiry = false } = {}) {
  const issues = [];
  const parsed = {};
  for (const key of expiry ? ['issueDate', 'expiryDate'] : ['issueDate']) {
    if (!fields[key]) continue;
    parsed[key] = parseDocumentDate(fields[key].value);
    if (parsed[key].status !== 'parsed' || fields[key].confidence === 'low') {
      issues.push(issue(doc, 'DATE_UNCERTAIN', 'manual_review', 'Date needs applicant review', `We could not confidently read this date: ${fields[key].value}.`, 'Use a readable date such as 12 Aug 2030 or 2030-08-12 and re-check.', { field: key, detectedValue: fields[key].value, confidence: 'low' }));
    } else if (key === 'expiryDate' && parsed[key].value < today) {
      issues.push(issue(doc, 'DOC_EXPIRED', 'error', 'Document appears expired', `The detected expiry date is ${fields[key].value}.`, 'Upload a currently valid document.', { field: key, detectedValue: fields[key].value, expected: 'A currently valid document' }));
    } else if (key === 'issueDate' && parsed[key].value > today) {
      issues.push(issue(doc, 'FUTURE_ISSUE_DATE', 'warning', 'Issue date is in the future', `The detected issue date is ${fields[key].value}.`, 'Review the date and upload the correct document.', { field: key, detectedValue: fields[key].value }));
    }
  }
  if (parsed.issueDate?.value && parsed.expiryDate?.value && parsed.expiryDate.value < parsed.issueDate.value) issues.push(issue(doc, 'DATE_ORDER', 'error', 'Document dates are inconsistent', 'Expiry precedes the detected issue date.', 'Review the dates and replace the document.'));
  return issues;
}
