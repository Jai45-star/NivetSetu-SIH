import fs from 'node:fs/promises';
import { StorageService, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from './storageService.js';
import { extractDocument } from './documentExtractionService.js';
import { extractFields } from './fieldExtractionService.js';
import { issue, validationState, VALIDATION_VERSION } from '../utils/validationHelpers.js';
import { panValidator } from '../validators/panValidator.js';
import { incorporationValidator } from '../validators/incorporationValidator.js';
import { leaseValidator } from '../validators/leaseValidator.js';
import { environmentalValidator } from '../validators/environmentalValidator.js';
import { fireLayoutValidator } from '../validators/fireLayoutValidator.js';
import { dateChecks } from '../validators/commonValidators.js';

export function detectFileFormat(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'PDF';
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'PNG';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'JPEG';
  return null;
}
export async function validateDocument(document, { today, force = false, extractor = extractDocument } = {}) {
  const doc = { ...document };
  let issues = [];
  const done = (status) => ({ ...doc, validation: { status: status || validationState(issues), validatedAt: new Date(), version: VALIDATION_VERSION, issues } });
  if (!doc.storedName) {
    issues.push(issue(doc, 'DOC_MISSING', 'error', `${doc.name} missing`, 'This mandatory document has not been uploaded.', 'Upload the required document.'));
    doc.extraction = null;
    return done('not_uploaded');
  }
  try {
    const filePath = StorageService.getFilePath(doc.storedName);
    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe file');
    if (!stat.size || stat.size > MAX_FILE_SIZE_BYTES || stat.size !== doc.size) {
      issues.push(issue(doc, 'FILE_SIZE', 'error', 'File cannot be validated', 'The file is empty, changed, or exceeds the 10 MB limit.', 'Replace it with a non-empty file under 10 MB.'));
      return done();
    }
    const buffer = await fs.readFile(filePath);
    const format = detectFileFormat(buffer);
    const expectedMime = { PDF: 'application/pdf', PNG: 'image/png', JPEG: 'image/jpeg' }[format];
    const formats = (doc.acceptedFormats || ['PDF']).map(f => f === 'JPG' ? 'JPEG' : f);
    if (!format || !formats.includes(format) || !ALLOWED_MIME_TYPES.has(doc.mimeType) || (doc.mimeType.replace('image/jpg', 'image/jpeg') !== expectedMime)) {
      issues.push(issue(doc, 'FILE_TYPE', 'error', 'Document format is not supported', `${formats.join(' / ')} required. The file content must match its type.`, `Upload the document again as ${formats.join(' or ')}.`));
      doc.extraction = null;
      return done();
    }
    const unchanged = doc.extraction?.fingerprint === `${doc.storedName}:${stat.size}:${stat.mtimeMs}` && doc.extraction?.version === VALIDATION_VERSION;
    if (force || !unchanged) {
      const extracted = await extractor(doc);
      doc.extraction = { status: extracted.status, textAvailable: extracted.textAvailable, confidence: extracted.confidence,
        method: extracted.method, fingerprint: `${doc.storedName}:${stat.size}:${stat.mtimeMs}`, version: VALIDATION_VERSION,
        extractedFields: extracted.textAvailable ? extractFields(extracted.text, extracted.confidence) : {} };
    }
    if (!doc.extraction.textAvailable) {
      issues.push(issue(doc, 'EXTRACTION_REVIEW', 'manual_review', 'Text needs manual review', "We couldn't automatically read this document. It can still be reviewed manually.", 'Upload a text-based PDF or a clearer image, or seek manual review.', { confidence: 'low' }));
      return done();
    }
    const fields = doc.extraction.extractedFields;
    if (doc.documentType === 'pan_incorporation') {
      issues.push(...(fields.pan ? panValidator(doc, fields) : incorporationValidator(doc, fields)), ...dateChecks(doc, fields, today));
    } else if (doc.documentType === 'ownership_lease') issues.push(...leaseValidator(doc, fields, today));
    else if (doc.documentType === 'pollution_declaration') issues.push(...environmentalValidator(doc, fields, today));
    else issues.push(...fireLayoutValidator(doc));
    for (const [field, data] of Object.entries(fields)) {
      if (data.confidence === 'low' && !issues.some(i => i.field === field)) issues.push(issue(doc, 'FIELD_CONFLICT', 'manual_review', 'Conflicting field values detected', `More than one value was found for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`, 'Review the original document and upload a clearer copy.', { field, confidence: 'low' }));
    }
    if (doc.documentType === 'pollution_declaration') issues.push(issue(doc, 'SCOPE_ENVIRONMENT', 'info', 'Content checks only', 'Environmental approval authenticity was not assessed.', 'Final scrutiny remains with the authorized department.'));
    return done();
  } catch {
    doc.extraction = { status: 'failed', textAvailable: false, confidence: 'low', extractedFields: {} };
    issues = [issue(doc, 'EXTRACTION_FAILED', 'manual_review', 'Document needs manual review', 'The stored file could not be read reliably. Other document checks will continue.', 'Replace the file with a readable copy or seek manual review.', { confidence: 'low' })];
    return done();
  }
}
