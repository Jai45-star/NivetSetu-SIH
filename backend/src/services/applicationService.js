import { Application } from '../models/Application.js';
import { isDbConnected } from '../config/db.js';
import { ApprovalRuleService } from './approvalRuleService.js';
import { StorageService } from './storageService.js';

// In-memory fallback store when MongoDB is not connected
const inMemoryStore = new Map();

// Helper to calculate deterministic readiness score
export function calculateReadiness(documents = []) {
  if (!documents.length) return 0;
  const uploaded = documents.filter(d => d.status === 'uploaded' || d.status === 'valid').length;
  return Math.round((uploaded / documents.length) * 100);
}

// Initial demo showcase seed data
export const SHOWCASE_SEEDS = [
  {
    applicationId: 'NS-DEMO-001',
    userId: 'demo-entrepreneur-001',
    unitName: 'Food Processing Unit',
    businessProfile: {
      industryType: 'Food Processing',
      location: 'Pune, Maharashtra',
      investmentRange: '₹1 – ₹5 Crore',
      employeeRange: '50 – 200',
      businessStage: 'New Unit',
      description: 'Manufacturing of packaged organic fruit snacks and cold-pressed juices.',
    },
    status: 'draft',
    currentStep: 3,
    createdAt: new Date('2026-08-12T09:30:00Z'),
    updatedAt: new Date('2026-08-12T11:45:00Z'),
  },
  {
    applicationId: 'NS-DEMO-002',
    userId: 'demo-entrepreneur-001',
    unitName: 'Textile Manufacturing Unit',
    businessProfile: {
      industryType: 'Textile Manufacturing',
      location: 'Pune, Maharashtra',
      investmentRange: '₹5 – ₹25 Crore',
      employeeRange: '201 – 500',
      businessStage: 'Expansion',
      description: 'High-speed synthetic yarn spinning and automated weaving facility.',
    },
    status: 'under_review',
    currentStep: 4,
    createdAt: new Date('2026-08-05T08:00:00Z'),
    updatedAt: new Date('2026-08-06T14:20:00Z'),
  },
  {
    applicationId: 'NS-DEMO-003',
    userId: 'demo-entrepreneur-001',
    unitName: 'Chemical Unit',
    businessProfile: {
      industryType: 'Chemical Manufacturing',
      location: 'Thane, Maharashtra',
      investmentRange: '₹25 – ₹100 Crore',
      employeeRange: '50 – 200',
      businessStage: 'Existing Unit',
      description: 'Speciality intermediate polymer production facility in MIDC industrial belt.',
    },
    status: 'at_risk',
    currentStep: 4,
    createdAt: new Date('2026-07-28T10:15:00Z'),
    updatedAt: new Date('2026-08-01T16:00:00Z'),
  },
];

let isSeeded = false;

export async function ensureSeedData() {
  if (isSeeded) return;

  for (const seed of SHOWCASE_SEEDS) {
    const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(seed.businessProfile);
    
    // Simulate some documents for showcase display
    const documents = requiredDocuments.map((doc, idx) => {
      if (seed.status === 'draft' && idx === 0) {
        return {
          ...doc,
          status: 'uploaded',
          originalName: 'entity_pan_card.pdf',
          storedName: 'demo-pan.pdf',
          mimeType: 'application/pdf',
          size: 1024 * 340,
          uploadedAt: new Date('2026-08-12T10:15:00Z'),
        };
      }
      if (seed.status === 'under_review' || seed.status === 'at_risk') {
        return {
          ...doc,
          status: 'uploaded',
          originalName: `${doc.documentId}_verified.pdf`,
          storedName: `demo-${doc.documentId}.pdf`,
          mimeType: 'application/pdf',
          size: 1024 * 450,
          uploadedAt: new Date('2026-08-05T12:00:00Z'),
        };
      }
      return doc;
    });

    const readinessScore = calculateReadiness(documents);

    const fullRecord = {
      ...seed,
      requiredApprovals: approvals,
      documents,
      readinessScore,
    };

    // Store in inMemoryStore
    inMemoryStore.set(seed.applicationId, fullRecord);

    // If MongoDB is connected, also upsert to Mongoose
    if (isDbConnected()) {
      try {
        await Application.findOneAndUpdate(
          { applicationId: seed.applicationId },
          { $set: fullRecord },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn(`[ApplicationService] Seed failed for ${seed.applicationId}:`, err.message);
      }
    }
  }

  isSeeded = true;
}

export class ApplicationService {
  static async listApplications(userId = 'demo-entrepreneur-001', filterStatus = null) {
    await ensureSeedData();

    let list = [];
    if (isDbConnected()) {
      const query = { userId };
      if (filterStatus && filterStatus !== 'all') {
        query.status = filterStatus;
      }
      list = await Application.find(query).sort({ updatedAt: -1 }).lean();
    } else {
      list = Array.from(inMemoryStore.values())
        .filter(app => app.userId === userId)
        .filter(app => {
          if (!filterStatus || filterStatus === 'all') return true;
          return app.status === filterStatus;
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    return list;
  }

  static async getApplicationById(id) {
    await ensureSeedData();

    if (isDbConnected()) {
      let doc = await Application.findOne({ applicationId: id }).lean();
      if (!doc && id.match(/^[0-9a-fA-F]{24}$/)) {
        doc = await Application.findById(id).lean();
      }
      if (doc) return doc;
    }

    // Check memory store
    if (inMemoryStore.has(id)) {
      return inMemoryStore.get(id);
    }
    for (const app of inMemoryStore.values()) {
      if (app.applicationId === id || app._id === id) {
        return app;
      }
    }

    return null;
  }

  static async createDraft(userId = 'demo-entrepreneur-001', initialData = {}) {
    await ensureSeedData();

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const applicationId = `NS-2026-${randomSuffix}`;

    const newApp = {
      applicationId,
      userId,
      unitName: initialData.unitName || 'New Industrial Unit',
      businessProfile: {
        industryType: initialData.businessProfile?.industryType || '',
        location: initialData.businessProfile?.location || '',
        investmentRange: initialData.businessProfile?.investmentRange || '',
        employeeRange: initialData.businessProfile?.employeeRange || '',
        businessStage: initialData.businessProfile?.businessStage || '',
        description: initialData.businessProfile?.description || '',
      },
      requiredApprovals: [],
      documents: [],
      status: 'draft',
      currentStep: 1,
      readinessScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If initial business profile has an industry, generate checklist immediately
    if (newApp.businessProfile.industryType) {
      const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(newApp.businessProfile);
      newApp.requiredApprovals = approvals;
      newApp.documents = requiredDocuments;
    }

    if (isDbConnected()) {
      const created = await Application.create(newApp);
      inMemoryStore.set(applicationId, created.toObject());
      return created.toObject();
    }

    inMemoryStore.set(applicationId, newApp);
    return newApp;
  }

  static async updateBusinessProfile(id, profile) {
    const app = await this.getApplicationById(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }

    const updatedProfile = {
      ...app.businessProfile,
      ...profile,
    };

    // Formulate a clean unit name if still default
    let unitName = app.unitName;
    if (unitName === 'New Industrial Unit' && updatedProfile.industryType) {
      unitName = `${updatedProfile.industryType} Unit`;
    }

    // Generate checklist based on updated profile
    const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(updatedProfile);

    // Preserve already uploaded documents if documentId matches
    const existingDocsMap = new Map((app.documents || []).map(d => [d.documentId, d]));
    const mergedDocuments = requiredDocuments.map(reqDoc => {
      const existing = existingDocsMap.get(reqDoc.documentId);
      if (existing && existing.status === 'uploaded') {
        return {
          ...reqDoc,
          status: 'uploaded',
          originalName: existing.originalName,
          storedName: existing.storedName,
          mimeType: existing.mimeType,
          size: existing.size,
          uploadedAt: existing.uploadedAt,
        };
      }
      return reqDoc;
    });

    const readinessScore = calculateReadiness(mergedDocuments);

    const patch = {
      unitName,
      businessProfile: updatedProfile,
      requiredApprovals: approvals,
      documents: mergedDocuments,
      readinessScore,
      currentStep: Math.max(app.currentStep || 1, 2),
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const updated = await Application.findOneAndUpdate(
        { applicationId: app.applicationId },
        { $set: patch },
        { new: true }
      ).lean();
      inMemoryStore.set(app.applicationId, updated);
      return updated;
    }

    const updated = { ...app, ...patch };
    inMemoryStore.set(app.applicationId, updated);
    return updated;
  }

  static async generateApprovals(id) {
    const app = await this.getApplicationById(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }

    const { approvals, requiredDocuments } = ApprovalRuleService.generateApprovalsForProfile(app.businessProfile);

    // Preserve existing uploaded files
    const existingDocsMap = new Map((app.documents || []).map(d => [d.documentId, d]));
    const mergedDocuments = requiredDocuments.map(reqDoc => {
      const existing = existingDocsMap.get(reqDoc.documentId);
      if (existing && existing.status === 'uploaded') {
        return {
          ...reqDoc,
          status: 'uploaded',
          originalName: existing.originalName,
          storedName: existing.storedName,
          mimeType: existing.mimeType,
          size: existing.size,
          uploadedAt: existing.uploadedAt,
        };
      }
      return reqDoc;
    });

    const readinessScore = calculateReadiness(mergedDocuments);

    const patch = {
      requiredApprovals: approvals,
      documents: mergedDocuments,
      readinessScore,
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const updated = await Application.findOneAndUpdate(
        { applicationId: app.applicationId },
        { $set: patch },
        { new: true }
      ).lean();
      inMemoryStore.set(app.applicationId, updated);
      return updated;
    }

    const updated = { ...app, ...patch };
    inMemoryStore.set(app.applicationId, updated);
    return updated;
  }

  static async attachDocument(id, documentId, fileData) {
    const app = await this.getApplicationById(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }

    const documents = (app.documents || []).map(doc => {
      if (doc.documentId === documentId) {
        // Delete older stored file if it existed
        if (doc.storedName && doc.storedName !== fileData.storedName) {
          StorageService.deleteFile(doc.storedName);
        }
        return {
          ...doc,
          status: 'uploaded',
          originalName: fileData.originalName,
          storedName: fileData.storedName,
          mimeType: fileData.mimeType,
          size: fileData.size,
          uploadedAt: new Date(),
        };
      }
      return doc;
    });

    const readinessScore = calculateReadiness(documents);
    const status = readinessScore === 100 ? 'ready_for_validation' : app.status;

    const patch = {
      documents,
      readinessScore,
      status,
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const updated = await Application.findOneAndUpdate(
        { applicationId: app.applicationId },
        { $set: patch },
        { new: true }
      ).lean();
      inMemoryStore.set(app.applicationId, updated);
      return updated;
    }

    const updated = { ...app, ...patch };
    inMemoryStore.set(app.applicationId, updated);
    return updated;
  }

  static async removeDocument(id, documentId) {
    const app = await this.getApplicationById(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }

    const documents = (app.documents || []).map(doc => {
      if (doc.documentId === documentId) {
        if (doc.storedName) {
          StorageService.deleteFile(doc.storedName);
        }
        return {
          ...doc,
          status: 'missing',
          originalName: null,
          storedName: null,
          mimeType: null,
          size: null,
          uploadedAt: null,
        };
      }
      return doc;
    });

    const readinessScore = calculateReadiness(documents);
    const status = app.status === 'ready_for_validation' ? 'draft' : app.status;

    const patch = {
      documents,
      readinessScore,
      status,
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const updated = await Application.findOneAndUpdate(
        { applicationId: app.applicationId },
        { $set: patch },
        { new: true }
      ).lean();
      inMemoryStore.set(app.applicationId, updated);
      return updated;
    }

    const updated = { ...app, ...patch };
    inMemoryStore.set(app.applicationId, updated);
    return updated;
  }

  static async updateCurrentStep(id, step) {
    const app = await this.getApplicationById(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }

    const validatedStep = Math.min(Math.max(Number(step) || 1, 1), 4);
    const patch = {
      currentStep: validatedStep,
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const updated = await Application.findOneAndUpdate(
        { applicationId: app.applicationId },
        { $set: patch },
        { new: true }
      ).lean();
      inMemoryStore.set(app.applicationId, updated);
      return updated;
    }

    const updated = { ...app, ...patch };
    inMemoryStore.set(app.applicationId, updated);
    return updated;
  }
}
