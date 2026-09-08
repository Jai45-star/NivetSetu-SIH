import { requiredField } from './commonValidators.js';
export function incorporationValidator(doc, fields) { return [...requiredField(doc, fields, 'companyName', 'Company name'), ...requiredField(doc, fields, 'documentNumber', 'Registration reference')]; }
