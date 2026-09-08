import { compareCompanyNames } from '../utils/textNormalizer.js';
import { issue } from '../utils/validationHelpers.js';
const entityTypes = ['pan_incorporation', 'ownership_lease', 'pollution_declaration'];
export function validateConsistency(documents) {
  const identity = documents.find(d => d.documentType === 'pan_incorporation');
  const anchor = identity?.extraction?.extractedFields?.companyName;
  const comparisons = [], issues = [];
  for (const doc of documents.filter(d => entityTypes.includes(d.documentType) && d !== identity)) {
    const name = doc.extraction?.extractedFields?.companyName;
    const reliable = anchor?.confidence !== 'low' && name?.confidence !== 'low' && identity?.storedName && doc.storedName;
    const status = reliable ? compareCompanyNames(anchor?.value, name?.value) : 'unavailable';
    comparisons.push({ documentId: doc.documentId, documentName: doc.name, detectedValue: name?.value || null, referenceDocument: identity?.name || 'Company identification', expectedValue: anchor?.value || null, status });
    if (status === 'mismatch' || status === 'possible_match') issues.push(issue(doc, 'COMPANY_MISMATCH', 'warning', 'Company name mismatch detected', `${identity.name}: ${anchor.value}. ${doc.name}: ${name.value}.`, 'Review or upload the correct document.', { field: 'companyName', detectedValue: name.value, expected: anchor.value, referenceDocument: identity.name, confidence: status === 'possible_match' ? 'medium' : 'high' }));
  }
  // Missing/unreadable fields already have document-level issues; avoid duplicate noise.
  return { total: comparisons.length, matched: comparisons.filter(c => c.status === 'match').length, comparisons, issues };
}
