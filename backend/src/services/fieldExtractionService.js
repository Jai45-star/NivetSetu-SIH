import { normalizeText } from '../utils/textNormalizer.js';
const labels = {
  companyName: '(?:company name|name of (?:the )?company|entity name|tenant name|lessee name)',
  applicantName: '(?:applicant name|name of applicant)',
  pan: '(?:pan(?: number| no\\.?)?|permanent account number)',
  documentNumber: '(?:cin|registration(?: number| no\\.?)|reference(?: number| no\\.?)|document number)',
  issueDate: '(?:issue date|date of issue|issued on|commencement date)',
  expiryDate: '(?:expiry date|date of expiry|expires on|valid until|valid up to|lease end date)',
  address: '(?:registered address|premises address|address)',
};
export function extractFields(text, confidence = 'high') {
  const normalized = normalizeText(text);
  const fields = {};
  for (const [key, label] of Object.entries(labels)) {
    const pattern = new RegExp(`^\\s*${label}\\s*[:=]\\s*([^\\n]{1,240})$`, 'gmi');
    const values = [...normalized.matchAll(pattern)].map(m => m[1].trim());
    if (values.length) fields[key] = { value: values[0], confidence: new Set(values).size > 1 ? 'low' : confidence };
  }
  return fields;
}
