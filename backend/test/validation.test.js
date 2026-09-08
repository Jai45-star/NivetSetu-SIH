import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { demoPdf, fixtureLines, demoProfile } from '../fixtures/demoPdf.js';
import { StorageService } from '../src/services/storageService.js';
import { validateDocument } from '../src/services/documentValidationService.js';
import { extractDocument } from '../src/services/documentExtractionService.js';
import { compareCompanyNames } from '../src/utils/textNormalizer.js';
import { parseDocumentDate } from '../src/utils/dateParser.js';
import { calculateValidationReadiness } from '../src/services/readinessService.js';
import { buildValidationReport, validateApplication } from '../src/services/applicationValidationService.js';
import { ApplicationService } from '../src/services/applicationService.js';
import { Application } from '../src/models/Application.js';
import { app } from '../src/app.js';

async function stored(type, variant = 'valid', buffer) {
  const data = buffer || demoPdf(fixtureLines(type, variant));
  const storedName = `test-${randomUUID()}.pdf`;
  await fs.writeFile(StorageService.getFilePath(storedName), data);
  return { documentId: type, documentType: type, name: type, acceptedFormats: ['PDF', 'PNG', 'JPEG'], storedName, originalName: `${type}.pdf`, mimeType: 'application/pdf', size: data.length, status: 'uploaded' };
}
const options = { today: '2026-09-08' };
test('missing document is deterministic and never runs extraction', async () => {
  const doc = await validateDocument({ documentType: 'fire_safety_layout', name: 'Fire Layout' }, { ...options, extractor: () => { throw new Error('Must not run'); } });
  assert.equal(doc.validation.status, 'not_uploaded');
  assert.equal(doc.validation.issues[0].code, 'DOC_MISSING');
});
test('date parsing rejects impossible/ambiguous dates and accepts explicit formats', () => {
  assert.equal(parseDocumentDate('2024-02-30').status, 'invalid');
  assert.equal(parseDocumentDate('03/04/2026').status, 'ambiguous');
  assert.equal(parseDocumentDate('12 Aug 2024').value, '2024-08-12');
  assert.equal(parseDocumentDate('2024-02-29').status, 'parsed');
});
test('suffix equivalence is accepted but different entities and legal forms are not', () => {
  assert.equal(compareCompanyNames('Shree Foods Pvt. Ltd.', 'SHREE FOODS PRIVATE LIMITED'), 'match');
  assert.equal(compareCompanyNames('Shree Foods Pvt Ltd', 'Shree Agro Industries LLP'), 'mismatch');
  assert.notEqual(compareCompanyNames('Shree Foods Ltd', 'Shree Foods LLP'), 'match');
});
test('real PDF extraction detects expiry, persists fields only and caches extraction', async () => {
  const doc = await stored('ownership_lease', 'expired');
  try {
    const first = await validateDocument(doc, options);
    assert.equal(first.validation.status, 'invalid');
    assert.ok(first.validation.issues.some(i => i.code === 'DOC_EXPIRED'));
    assert.equal(first.extraction.extractedFields.companyName.value, 'SHREE FOODS PRIVATE LIMITED');
    assert.equal(first.extraction.text, undefined);
    const cached = await validateDocument(first, { ...options, extractor: () => { throw new Error('Cache missed'); } });
    assert.ok(cached.validation.issues.some(i => i.code === 'DOC_EXPIRED'));
    assert.equal(cached.extraction.status, 'extracted');
  } finally { StorageService.deleteFile(doc.storedName); }
});
test('parser failure, scanned PDF, uncertain OCR and timeout all become manual review', async () => {
  const doc = await stored('pan_incorporation', 'valid', Buffer.from('%PDF-1.4 corrupt document'));
  try {
    assert.equal((await validateDocument(doc, options)).validation.status, 'manual_review');
    assert.equal((await validateDocument(doc, { ...options, extractor: async () => { throw new Error('OCR failure'); } })).validation.status, 'manual_review');
    assert.equal((await validateDocument(doc, { ...options, extractor: async () => ({ status: 'unreadable', textAvailable: false }) })).validation.status, 'manual_review');
    assert.equal((await extractDocument(doc, { timeoutMs: 1 })).textAvailable, false);
  } finally { StorageService.deleteFile(doc.storedName); }
});
test('image-only/blank PDF needs manual review while other documents continue', async () => {
  const unreadable = await stored('pan_incorporation', 'valid', demoPdf([]));
  const readable = await stored('ownership_lease');
  try {
    const { documents, report } = await buildValidationReport({ unitName: 'Test', businessProfile: demoProfile, documents: [unreadable, readable] }, options);
    assert.equal(documents[0].validation.status, 'manual_review');
    assert.equal(documents[1].validation.status, 'valid');
    assert.equal(report.readiness.ready, false);
  } finally { StorageService.deleteFile(unreadable.storedName); StorageService.deleteFile(readable.storedName); }
});
test('MIME and actual format, file size and path safety are enforced', async () => {
  const doc = await stored('ownership_lease');
  try {
    assert.equal((await validateDocument({ ...doc, mimeType: 'image/png' }, options)).validation.issues[0].code, 'FILE_TYPE');
    assert.equal((await validateDocument({ ...doc, size: 0 }, options)).validation.issues[0].code, 'FILE_SIZE');
    assert.throws(() => StorageService.getFilePath('../.env'));
    assert.throws(() => StorageService.getFilePath('C:\\secret.txt'));
  } finally { StorageService.deleteFile(doc.storedName); }
});
test('40/40/20 formula is transparent and blockers can never produce ready', () => {
  const documents = Array.from({ length: 6 }, () => ({ storedName: 'file', validation: { status: 'valid' } }));
  assert.equal(calculateValidationReadiness(documents, { total: 2, matched: 2 }, []).score, 100);
  const blocked = calculateValidationReadiness(documents, { total: 2, matched: 2 }, [{ severity: 'error' }]);
  assert.equal(blocked.ready, false); assert.equal(blocked.score, 99);
  documents[0] = { validation: { status: 'not_uploaded' } };
  assert.equal(calculateValidationReadiness(documents, { total: 2, matched: 2 }, [{ severity: 'error' }]).score, 87);
  assert.equal(calculateValidationReadiness([], { total: 0, matched: 0 }, []).ready, false);
});
test('replacement invalidates persisted report; profile updates preserve uploads; old files removed after save', async () => {
  let application = await ApplicationService.createDraft('test-replacement', { businessProfile: demoProfile });
  const old = await stored('ownership_lease', 'expired');
  const next = await stored('ownership_lease');
  try {
    application = await ApplicationService.attachDocument(application.applicationId, old.documentId, old);
    application = await validateApplication(application.applicationId);
    assert.ok(application.validationReport);
    application = await ApplicationService.attachDocument(application.applicationId, next.documentId, next);
    assert.equal(application.validationReport, null);
    assert.equal(application.documents.find(d => d.documentId === next.documentId).validation, null);
    assert.equal(StorageService.fileExists(old.storedName), false);
    application = await validateApplication(application.applicationId);
    assert.ok(!application.validationReport.issues.some(i => i.code === 'DOC_EXPIRED'));
    application = await ApplicationService.updateBusinessProfile(application.applicationId, demoProfile);
    assert.equal(application.validationReport, null);
    assert.equal(application.documents.find(d => d.documentId === next.documentId).storedName, next.storedName);
    await assert.rejects(ApplicationService.submitApplication(application.applicationId), /pre-validation/);
  } finally { StorageService.deleteFile(old.storedName); StorageService.deleteFile(next.storedName); }
});
test('real image OCR works offline for a clearly labeled PAN fixture', async () => {
  const buffer = await fs.readFile(new URL('../fixtures/documents/pan_ocr.png', import.meta.url));
  const doc = await stored('pan_incorporation', 'valid', buffer);
  try {
    const validated = await validateDocument({ ...doc, mimeType: 'image/png' }, options);
    assert.equal(validated.extraction.method, 'image_ocr');
    assert.equal(validated.validation.status, 'valid');
    assert.equal(validated.extraction.extractedFields.pan.value, 'ABCDE1234F');
  } finally { StorageService.deleteFile(doc.storedName); }
});
test('three showcase issues, fixes, report reload, schema round-trip and guarded submission through API', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/applications`;
  let id;
  const request = async (path = '', method = 'GET', body) => {
    const response = await fetch(base + path, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    return { response, json: await response.json() };
  };
  const upload = async (type, variant = 'valid') => {
    const form = new FormData(); form.append('documentId', type);
    form.append('file', new Blob([demoPdf(fixtureLines(type, variant))], { type: 'application/pdf' }), `${type}.pdf`);
    const response = await fetch(`${base}/${id}/documents`, { method: 'POST', body: form });
    assert.equal(response.status, 200);
    return (await response.json()).data;
  };
  try {
    const created = await request('', 'POST', { unitName: 'Shree Foods', businessProfile: demoProfile });
    id = created.json.data.applicationId;
    assert.match(id, /^NS-\d{4}-[A-F0-9]{12}$/);
    for (const doc of created.json.data.documents) {
      if (doc.documentId === 'fire_safety_layout') continue;
      await upload(doc.documentId, doc.documentId === 'ownership_lease' ? 'expired' : doc.documentId === 'pollution_declaration' ? 'mismatch' : 'valid');
    }
    let validated = (await request(`/${id}/validate`, 'POST')).json.data;
    for (const code of ['DOC_MISSING', 'DOC_EXPIRED', 'COMPANY_MISMATCH']) assert.ok(validated.validationReport.issues.some(i => i.code === code), code);
    assert.equal((await request(`/${id}/submit`, 'POST')).response.status, 409);
    await upload('fire_safety_layout'); await upload('ownership_lease'); validated = await upload('pollution_declaration');
    assert.equal(validated.readinessScore, 100);
    assert.equal(validated.validationReport.readiness.ready, true);
    const loaded = (await request(`/${id}`)).json.data;
    assert.equal(loaded.validationStatus, 'passed');
    assert.equal((await request(`/${id}/validation`)).json.data.readiness.score, 100);
    const model = new Application(loaded); await model.validate();
    assert.equal(model.toObject().documents[0].extraction.extractedFields.companyName.value, 'Shree Foods Pvt. Ltd.');
    assert.equal(model.toObject().validationReport.readiness.ready, true);
    const before = await ApplicationService.getApplicationById(id);
    await ApplicationService.save(before, { validationReport: { ...before.validationReport, validationDay: '2000-01-01' } });
    assert.equal((await request(`/${id}/submit`, 'POST')).response.status, 409);
    await request(`/${id}/validate`, 'POST');
    const tampered = await ApplicationService.getApplicationById(id);
    await fs.appendFile(StorageService.getFilePath(tampered.documents[0].storedName), '\n');
    assert.equal((await request(`/${id}/submit`, 'POST')).response.status, 409);
    await upload('pan_incorporation');
    const submitted = (await request(`/${id}/submit`, 'POST')).json.data;
    assert.equal(submitted.status, 'submitted'); assert.ok(submitted.submittedAt);
    assert.equal((await request(`/${id}/submit`, 'POST')).json.data.submittedAt, submitted.submittedAt);
    assert.equal((await request(`/${id}/business-profile`, 'PATCH', demoProfile)).response.status, 409);
    assert.equal((await request(`/${id}/documents/ownership_lease`, 'DELETE')).response.status, 409);
  } finally {
    if (id) for (const doc of (await ApplicationService.getApplicationById(id)).documents) if (doc.storedName) StorageService.deleteFile(doc.storedName);
    await new Promise(resolve => server.close(resolve));
  }
});
