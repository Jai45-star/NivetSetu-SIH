import { requiredField, dateChecks } from './commonValidators.js';
export function leaseValidator(doc, fields, today) { return [...requiredField(doc, fields, 'companyName', 'Company or tenant name'), ...dateChecks(doc, fields, today, { expiry: true })]; }
