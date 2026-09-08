import { requiredField, dateChecks } from './commonValidators.js';
export function environmentalValidator(doc, fields, today) { return [...requiredField(doc, fields, 'companyName', 'Company name'), ...dateChecks(doc, fields, today, { expiry: true })]; }
