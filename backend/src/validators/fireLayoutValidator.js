import { issue } from '../utils/validationHelpers.js';
export function fireLayoutValidator(doc) { return [issue(doc, 'SCOPE_LAYOUT', 'info', 'File-level checks only', 'Engineering correctness, signatures and fire safety compliance were not assessed.', 'Final technical scrutiny remains with the authorized department.')]; }
