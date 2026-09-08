import { issue } from '../utils/validationHelpers.js';
import { requiredField } from './commonValidators.js';
export function panValidator(doc, fields) {
  const issues = requiredField(doc, fields, 'companyName', 'Company name');
  if (!fields.pan) return [...issues, ...requiredField(doc, fields, 'pan', 'PAN number')];
  if (fields.pan.confidence === 'low') return [...issues, ...requiredField(doc, fields, 'pan', 'PAN number')];
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.pan.value.toUpperCase())) issues.push(issue(doc, 'PAN_FORMAT', 'error', 'PAN format appears incorrect', `Detected PAN: ${fields.pan.value}.`, 'Review the identifier and upload a readable PAN document.', { field: 'pan', detectedValue: fields.pan.value, expected: 'Five letters, four digits, one letter' }));
  return issues;
}
