import { randomBytes } from 'node:crypto';
import { Application } from '../models/Application.js';
import { isDbConnected } from '../config/db.js';
import { ApprovalRuleService } from './approvalRuleService.js';
import { StorageService } from './storageService.js';
import { httpError, utcDay, VALIDATION_VERSION } from '../utils/validationHelpers.js';
import { calculateValidationReadiness } from './readinessService.js';
import { initializeWorkflow } from './workflowState.js';
import { governmentAdapter } from '../integrations/mockGovernmentAdapter.js';

const inMemoryStore = new Map();
const locks = new Set();
let seedPromise;
const profileFields = ['industryType', 'location', 'investmentRange', 'employeeRange', 'businessStage', 'description'];
export function calculateReadiness(documents = []) {
  return documents.length ? Math.round(100 * documents.filter(d => d.storedName).length / documents.length) : 0;
}
function unvalidated(documents) {
  return { documents, validationReport: null, validatedAt: null, validationStatus: 'not_validated',
    readinessScore: 0, readinessLabel: 'Not Ready', completenessScore: calculateReadiness(documents) };
}
export async function ensureSeedData() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO === 'false') return;
    const { SHOWCASE_SEEDS } = await import('../../fixtures/phase2Seeds.js');
    for (const seed of SHOWCASE_SEEDS) {
      const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(seed.businessProfile);
      const record = { ...seed, requiredApprovals: approvals, ...unvalidated(requiredDocuments) };
      if (isDbConnected()) await Application.updateOne({ applicationId: seed.applicationId }, { $setOnInsert: record }, { upsert: true, timestamps: false });
      else inMemoryStore.set(seed.applicationId, record);
    }
  })();
  return seedPromise;
}
export class ApplicationService {
  static async listAllApplications() {
    await ensureSeedData();
    if (isDbConnected()) return Application.find({}).sort({ updatedAt: -1 }).lean();
    return structuredClone([...inMemoryStore.values()]);
  }
  static async listApplications(userId = 'demo-entrepreneur-001', filterStatus = null) {
    await ensureSeedData();
    if (isDbConnected()) return Application.find({ userId, ...(filterStatus && filterStatus !== 'all' ? { status: filterStatus } : {}) }).sort({ updatedAt: -1 }).lean();
    return structuredClone([...inMemoryStore.values()].filter(a => a.userId === userId && (!filterStatus || filterStatus === 'all' || a.status === filterStatus)).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  }
  static async getApplicationById(id) {
    await ensureSeedData();
    if (isDbConnected()) return Application.findOne({ applicationId: id }).lean();
    return structuredClone(inMemoryStore.get(id) || null);
  }
  static async requireApplication(id) {
    const app = await this.getApplicationById(id);
    if (!app) throw httpError(404, 'Application not found');
    return app;
  }
  static assertEditable(app) {
    if (!['draft', 'ready_for_validation'].includes(app.status)) throw httpError(409, 'Submitted applications cannot be changed. Start a new draft.');
  }
  static async withLock(id, action) {
    if (locks.has(id)) throw httpError(409, 'This application is being updated. Please retry when the current check finishes.');
    locks.add(id);
    try { return await action(); } finally { locks.delete(id); }
  }
  static async save(app, patch) {
    const { __v, ...safePatch } = patch;
    const update = { ...safePatch, updatedAt: new Date() };
    if (isDbConnected()) {
      const result = await Application.findOneAndUpdate(
        { applicationId: app.applicationId, __v: app.__v ?? 0 },
        { $set: update, $inc: { __v: 1 } },
        { returnDocument: 'after', runValidators: true }
      ).lean();
      if (!result) throw httpError(409, 'Application changed. Refresh and retry.');
      return result;
    }
    const current = inMemoryStore.get(app.applicationId);
    if ((current?.__v ?? 0) !== (app.__v ?? 0)) throw httpError(409, 'Application changed. Refresh and retry.');
    const updated = { ...app, ...update, __v: (app.__v ?? 0) + 1 };
    inMemoryStore.set(app.applicationId, structuredClone(updated));
    return structuredClone(updated);
  }
  static async createDraft(userId = 'demo-entrepreneur-001', initialData = {}) {
    await ensureSeedData();
    const applicationId = `NS-${new Date().getFullYear()}-${randomBytes(6).toString('hex').toUpperCase()}`;
    const businessProfile = Object.fromEntries(profileFields.map(key => [key, typeof initialData.businessProfile?.[key] === 'string' ? initialData.businessProfile[key].slice(0, 2000) : '']));
    const checklist = businessProfile.industryType ? ApprovalRuleService.generateApprovalsForProfile(businessProfile) : { approvals: [], requiredDocuments: [] };
    const app = { applicationId, userId, unitName: String(initialData.unitName || 'New Industrial Unit').slice(0, 150), businessProfile,
      requiredApprovals: checklist.approvals, ...unvalidated(checklist.requiredDocuments), status: 'draft', currentStep: 1, createdAt: new Date(), updatedAt: new Date(), __v: 0 };
    if (isDbConnected()) return (await Application.create(app)).toObject();
    inMemoryStore.set(applicationId, structuredClone(app));
    return app;
  }
  static async updateBusinessProfile(id, profile) {
    return this.withLock(id, async () => {
      const app = await this.requireApplication(id); this.assertEditable(app);
      const businessProfile = { ...app.businessProfile };
      for (const key of profileFields) if (key in profile) {
        if (typeof profile[key] !== 'string' || profile[key].length > 2000) throw httpError(400, 'Invalid business profile field');
        businessProfile[key] = profile[key].trim();
      }
      const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(businessProfile);
      const documents = requiredDocuments.map(req => {
        const existing = app.documents.find(d => d.documentId === req.documentId);
        return existing?.storedName ? { ...existing, ...req, status: 'uploaded', originalName: existing.originalName, storedName: existing.storedName,
          uploadedAt: existing.uploadedAt, validation: null } : req;
      });
      const result = await this.save(app, { businessProfile, requiredApprovals: approvals, ...unvalidated(documents), status: 'draft', currentStep: 2,
        unitName: app.unitName === 'New Industrial Unit' ? `${businessProfile.industryType} Unit` : app.unitName });
      for (const old of app.documents) if (old.storedName && !documents.some(d => d.storedName === old.storedName)) StorageService.deleteFile(old.storedName);
      return result;
    });
  }
  static async generateApprovals(id) {
    const app = await this.requireApplication(id);
    return this.updateBusinessProfile(id, app.businessProfile);
  }
  static async attachDocument(id, documentId, fileData) {
    return this.withLock(id, async () => {
      const app = await this.requireApplication(id); this.assertEditable(app);
      const old = app.documents.find(d => d.documentId === documentId);
      if (!old) throw httpError(404, 'Document requirement not found');
      const documents = app.documents.map(d => d.documentId === documentId ? { ...d, ...fileData, status: 'uploaded', uploadedAt: new Date(), extraction: null, validation: null } : d);
      const result = await this.save(app, { ...unvalidated(documents), status: calculateReadiness(documents) === 100 ? 'ready_for_validation' : 'draft' });
      if (old.storedName && old.storedName !== fileData.storedName) StorageService.deleteFile(old.storedName);
      return result;
    });
  }
  static async removeDocument(id, documentId) {
    return this.withLock(id, async () => {
      const app = await this.requireApplication(id); this.assertEditable(app);
      const old = app.documents.find(d => d.documentId === documentId);
      if (!old) throw httpError(404, 'Document requirement not found');
      const documents = app.documents.map(d => d.documentId === documentId ? { ...d, status: 'missing', originalName: null, storedName: null, mimeType: null, size: null, uploadedAt: null, extraction: null, validation: null } : d);
      const result = await this.save(app, { ...unvalidated(documents), status: 'draft' });
      if (old.storedName) StorageService.deleteFile(old.storedName);
      return result;
    });
  }
  static async updateCurrentStep(id, step) {
    return this.withLock(id, async () => {
      const app = await this.requireApplication(id); this.assertEditable(app);
      if (!Number.isInteger(step) || step < 1 || step > 4) throw httpError(400, 'Invalid wizard step');
      return this.save(app, { currentStep: step });
    });
  }
  static async submitApplication(id) {
    return this.withLock(id, async () => {
      const app = await this.requireApplication(id);
      if (app.submittedAt || app.status === 'submitted') return app;
      this.assertEditable(app);
      const report = app.validationReport;
      if (!report || report.version !== VALIDATION_VERSION || report.validationDay !== utcDay()) throw httpError(409, 'Run pre-validation again before submitting.');
      const readiness = calculateValidationReadiness(app.documents, report.consistency, report.issues);
      if (!readiness.ready || app.validationStatus !== 'passed') throw httpError(409, 'Resolve all issues and manual review items, then revalidate before submitting.');
      for (const doc of app.documents) {
        let unchanged = false;
        try { unchanged = doc.storedName && StorageService.fingerprint(doc.storedName) === doc.extraction?.fingerprint; } catch { /* Missing or changed files require a fresh report. */ }
        if (!unchanged) throw httpError(409, 'A stored document changed or is unavailable. Replace it and revalidate.');
      }
      const now = new Date();
      return this.save(app, { ...initializeWorkflow(app, now), integration: governmentAdapter.submitApplication(app), status: 'submitted', submittedAt: now, currentStep: 4 });
    });
  }
}
