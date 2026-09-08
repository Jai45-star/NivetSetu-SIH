import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  code: String, severity: { type: String, enum: ['info', 'warning', 'error', 'manual_review'] },
  documentType: String, documentId: String, documentName: String, title: String, message: String,
  field: String, detectedValue: String, expected: String, confidence: String, action: String, referenceDocument: String,
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  documentId: { type: String, required: true },
  documentType: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  description: { type: String, default: '' },
  acceptedFormats: [{ type: String }],
  usedInApprovals: [{ type: String }],
  status: {
    type: String,
    enum: ['missing', 'uploaded', 'valid', 'warning', 'invalid'],
    default: 'missing',
  },
  originalName: { type: String },
  storedName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date },
  extraction: {
    type: new mongoose.Schema({ status: String, textAvailable: Boolean, confidence: String, method: String,
      extractedFields: mongoose.Schema.Types.Mixed, fingerprint: String, version: String }, { _id: false }), default: null,
  },
  validation: {
    type: new mongoose.Schema({ status: { type: String, enum: ['not_uploaded', 'processing', 'valid', 'warning', 'invalid', 'manual_review'] },
      validatedAt: Date, issues: [IssueSchema], version: String }, { _id: false }), default: null,
  },
}, { _id: false });

const RequiredApprovalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  ruleId: { type: String, required: true },
  status: { type: String, default: 'Required' },
  estimatedSla: { type: String },
  reason: { type: String },
  documentCount: { type: Number, default: 0 },
  documentNames: [{ type: String }],
  matchedProfile: {
    industry: String,
    employees: String,
    stage: String,
    investment: String,
  },
}, { _id: false });

const ApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
    default: 'demo-entrepreneur-001',
  },
  unitName: {
    type: String,
    required: true,
    default: 'New Industrial Unit',
  },
  businessProfile: {
    industryType: { type: String, default: '' },
    location: { type: String, default: '' },
    investmentRange: { type: String, default: '' },
    employeeRange: { type: String, default: '' },
    businessStage: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  requiredApprovals: [RequiredApprovalSchema],
  documents: [DocumentSchema],
  validationStatus: { type: String, enum: ['not_validated', 'processing', 'passed', 'issues'], default: 'not_validated' },
  validationReport: { type: mongoose.Schema.Types.Mixed, default: null },
  validatedAt: Date,
  completenessScore: { type: Number, default: 0, min: 0, max: 100 },
  readinessLabel: { type: String, default: 'Not Ready' },
  submittedAt: Date,
  currentStage: String,
  workflow: mongoose.Schema.Types.Mixed,
  workflowEvents: [mongoose.Schema.Types.Mixed],
  queries: [mongoose.Schema.Types.Mixed],
  queryCount: { type: Number, default: 0 },
  internalNotes: [mongoose.Schema.Types.Mixed],
  assignedOfficer: mongoose.Schema.Types.Mixed,
  integration: mongoose.Schema.Types.Mixed,
  rejection: mongoose.Schema.Types.Mixed,
  decidedAt: Date,
  legacyWorkflow: Boolean,
  preValidationPassedAtSubmission: Boolean,
  status: {
    type: String,
    enum: ['draft', 'ready_for_validation', 'submitted', 'under_review', 'approved', 'at_risk', 'action_required', 'rejected'],
    default: 'draft',
    index: true,
  },
  currentStep: {
    type: Number,
    min: 1,
    max: 4,
    default: 1,
  },
  readinessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
}, {
  timestamps: true,
});

export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
