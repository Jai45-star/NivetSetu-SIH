import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileCheck2,
  Edit3,
} from 'lucide-react';
import { ApplicationApi } from '../../services/applicationApi';
import { ApplicationStepper } from '../../components/applications/ApplicationStepper';
import { BusinessProfileForm } from '../../components/forms/BusinessProfileForm';
import { ApprovalCard } from '../../components/applications/ApprovalCard';
import { DocumentRow } from '../../components/applications/DocumentRow';
import { ReadinessCard } from '../../components/applications/ReadinessCard';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/shared/StatusBadge';

export function ApplicationWizard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loadedIdRef = useRef(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [proceedSuccess, setProceedSuccess] = useState(false);

  // Initialize or load draft
  useEffect(() => {
    let isMounted = true;

    async function initDraft() {
      // If already loaded this ID, avoid duplicate fetch and unmount flicker
      if (id && loadedIdRef.current === id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (id && id !== 'new') {
          const data = await ApplicationApi.getApplication(id);
          if (isMounted) {
            loadedIdRef.current = data.applicationId;
            setApplication(data);
          }
        } else {
          // Creating fresh draft
          const newDraft = await ApplicationApi.createApplication({
            unitName: 'New Industrial Unit',
          });
          if (isMounted) {
            loadedIdRef.current = newDraft.applicationId;
            setApplication(newDraft);
            navigate(`/entrepreneur/applications/${newDraft.applicationId}`, { replace: true });
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to initialize draft');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initDraft();
    return () => { isMounted = false; };
  }, [id, navigate]);

  const showSaveNotice = (msg = 'Draft saved') => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  const handleStepChange = async (newStep) => {
    if (!application) return;
    try {
      const updated = await ApplicationApi.updateCurrentStep(application.applicationId, newStep);
      setApplication(updated);
      showSaveNotice();
    } catch {
      setApplication(prev => ({ ...prev, currentStep: newStep }));
    }
  };

  // Step 1: Save Business Profile
  const handleProfileSubmit = async (formData) => {
    if (!application) return;
    setIsSubmitting(true);
    try {
      const updated = await ApplicationApi.updateBusinessProfile(application.applicationId, formData);
      setApplication(updated);
      showSaveNotice('Business profile saved & approvals generated');
    } catch (err) {
      setError(err.message || 'Failed to save business profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Document Upload
  const handleDocumentUpload = async (documentId, file) => {
    if (!application) return;
    setUploadingDocId(documentId);
    try {
      const updated = await ApplicationApi.uploadDocument(application.applicationId, documentId, file);
      setApplication(updated);
      showSaveNotice('Document uploaded successfully');
    } catch (err) {
      throw err;
    } finally {
      setUploadingDocId(null);
    }
  };

  // Step 3: Document Removal
  const handleDocumentRemove = async (documentId) => {
    if (!application) return;
    try {
      const updated = await ApplicationApi.removeDocument(application.applicationId, documentId);
      setApplication(updated);
      showSaveNotice('Document removed');
    } catch (err) {
      setError(err.message || 'Failed to remove document');
    }
  };

  if (loading) {
    return (
      <div className="wizard-loading-state">
        <div className="loading-spinner" />
        <p>Loading application draft...</p>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="wizard-error-state">
        <AlertCircle size={36} className="text-danger" />
        <h2>Unable to load application</h2>
        <p>{error}</p>
        <Button asChild variant="outline">
          <Link to="/entrepreneur">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const currentStep = application?.currentStep || 1;
  const businessProfile = application?.businessProfile || {};
  const approvals = application?.requiredApprovals || [];
  const documents = application?.documents || [];
  const readinessScore = application?.readinessScore || 0;

  const totalDocs = documents.length;
  const uploadedDocs = documents.filter(d => d.status === 'uploaded' || d.status === 'valid').length;
  const allDocsUploaded = totalDocs > 0 && uploadedDocs === totalDocs;

  return (
    <div className="application-wizard">
      {/* Top Wizard Bar */}
      <div className="wizard-top-bar">
        <div className="wizard-title-col">
          <div className="wizard-breadcrumbs">
            <Link to="/entrepreneur/applications">Applications</Link>
            <span>/</span>
            <span>{application.applicationId}</span>
          </div>
          <h1>{application.unitName || 'New Industrial Unit'}</h1>
          <p className="wizard-meta">
            <span>Role: Entrepreneur</span>
            <span className="dot-sep">·</span>
            <span>Status: <StatusBadge tone={application.status === 'ready_for_validation' ? 'primary' : 'warning'}>{application.status === 'ready_for_validation' ? 'Ready for Validation' : 'Draft'}</StatusBadge></span>
          </p>
        </div>

        <div className="wizard-actions-col">
          {saveFeedback && (
            <span className="save-indicator">
              <CheckCircle2 size={13} className="text-success" /> {saveFeedback}
            </span>
          )}
          <Button asChild variant="outline" size="default">
            <Link to="/entrepreneur/applications">Save & Exit</Link>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <ApplicationStepper
        currentStep={currentStep}
        onStepClick={handleStepChange}
        maxCompletedStep={Math.max(currentStep, application.currentStep || 1)}
      />

      {/* STEP 1: Business Profile */}
      {currentStep === 1 && (
        <div className="wizard-step-content step-1-grid">
          <div className="step-main-panel">
            <div className="step-header">
              <h2>Business Profile</h2>
              <p>Help us understand your business to get the right approvals.</p>
            </div>

            <BusinessProfileForm
              key={application.applicationId}
              initialData={businessProfile}
              onSubmit={handleProfileSubmit}
              isSubmitting={isSubmitting}
              showBack={false}
            />
          </div>

          <aside className="step-side-panel">
            <Card className="wizard-context-card">
              <div className="context-card-top">
                <span className="context-badge">What's Next?</span>
                <h3>Rule-Based Approval Engine</h3>
                <p>
                  We'll evaluate your industry, workforce size, and stage to prepare a relevant prototype approval checklist.
                </p>
              </div>

              <div className="context-card-art" aria-hidden="true">
                <div className="art-skyline">
                  <Building2 size={38} strokeWidth={1.5} />
                </div>
              </div>

              <div className="context-card-points">
                <div>
                  <Sparkles size={14} className="text-primary" />
                  <span>Only relevant statutory approvals for Maharashtra</span>
                </div>
                <div>
                  <FileCheck2 size={14} className="text-success" />
                  <span>Identifies documents you can reuse across multiple departments</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* STEP 2: Required Approvals */}
      {currentStep === 2 && (
        <div className="wizard-step-content step-2-container">
          <div className="step-header flex-between">
            <div>
              <h2>Required Approvals</h2>
              <p>Prototype checklist generated from demo regulatory rules for {businessProfile.industryType || 'your industry'}.</p>
            </div>
            <span className="demo-rules-badge">
              <ShieldCheck size={14} /> Demo Regulatory Ruleset
            </span>
          </div>

          <div className="approvals-grid">
            {approvals.length > 0 ? (
              approvals.map(approval => (
                <ApprovalCard key={approval.id} approval={approval} />
              ))
            ) : (
              <Card className="empty-state-box">
                <AlertCircle size={28} />
                <p>No approvals generated yet. Please verify your business profile details.</p>
                <Button variant="outline" onClick={() => handleStepChange(1)}>
                  Return to Business Profile
                </Button>
              </Card>
            )}
          </div>

          <div className="step-nav-bar">
            <Button variant="outline" onClick={() => handleStepChange(1)}>
              <ArrowLeft size={16} /> Back to Profile
            </Button>
            <Button variant="default" onClick={() => handleStepChange(3)}>
              Continue to Documents <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Upload Documents */}
      {currentStep === 3 && (
        <div className="wizard-step-content step-3-grid">
          <div className="step-main-panel">
            <div className="step-header">
              <h2>Upload Documents</h2>
              <p>Upload the required documents to prepare your application.</p>
            </div>

            <div className="docs-list-header">
              <h3>Required Documents ({uploadedDocs}/{totalDocs})</h3>
              <small>Duplicate requirements across approvals only need to be uploaded once.</small>
            </div>

            <div className="documents-list">
              {documents.map(doc => (
                <DocumentRow
                  key={doc.documentId}
                  document={doc}
                  applicationId={application.applicationId}
                  onUpload={handleDocumentUpload}
                  onRemove={handleDocumentRemove}
                  isUploading={uploadingDocId === doc.documentId}
                />
              ))}
            </div>

            <div className="step-nav-bar mt-6">
              <Button variant="outline" onClick={() => handleStepChange(2)}>
                <ArrowLeft size={16} /> Back to Approvals
              </Button>
              <Button variant="default" onClick={() => handleStepChange(4)}>
                Continue to Review <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          <aside className="step-side-panel">
            <ReadinessCard
              documents={documents}
              readinessScore={readinessScore}
            />
          </aside>
        </div>
      )}

      {/* STEP 4: Review & Submit */}
      {currentStep === 4 && (
        <div className="wizard-step-content step-4-container">
          <div className="step-header">
            <h2>Review Application Draft</h2>
            <p>Verify all sections before proceeding to validation.</p>
          </div>

          <div className="review-grid">
            {/* Section 1: Business Profile Summary */}
            <Card className="review-card">
              <div className="review-card-header">
                <h3>Business Profile</h3>
                <Button variant="ghost" size="default" onClick={() => handleStepChange(1)}>
                  <Edit3 size={14} /> Edit
                </Button>
              </div>
              <div className="review-key-values">
                <div>
                  <small>Industry Type</small>
                  <strong>{businessProfile.industryType || '—'}</strong>
                </div>
                <div>
                  <small>Location</small>
                  <strong>{businessProfile.location || '—'}</strong>
                </div>
                <div>
                  <small>Investment</small>
                  <strong>{businessProfile.investmentRange || '—'}</strong>
                </div>
                <div>
                  <small>Workforce</small>
                  <strong>{businessProfile.employeeRange || '—'} employees</strong>
                </div>
                <div>
                  <small>Stage</small>
                  <strong>{businessProfile.businessStage || '—'}</strong>
                </div>
              </div>
              {businessProfile.description && (
                <p className="review-desc">{businessProfile.description}</p>
              )}
            </Card>

            {/* Section 2: Approvals Summary */}
            <Card className="review-card">
              <div className="review-card-header">
                <h3>Required Approvals ({approvals.length} identified)</h3>
                <Button variant="ghost" size="default" onClick={() => handleStepChange(2)}>
                  <Edit3 size={14} /> View
                </Button>
              </div>
              <ul className="review-approvals-list">
                {approvals.map(appr => (
                  <li key={appr.id}>
                    <div>
                      <strong>{appr.name}</strong>
                      <small>{appr.department}</small>
                    </div>
                    <StatusBadge tone="primary">Required</StatusBadge>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Section 3: Documents Completeness */}
            <Card className="review-card">
              <div className="review-card-header">
                <h3>Document Completeness</h3>
                <Button variant="ghost" size="default" onClick={() => handleStepChange(3)}>
                  <Edit3 size={14} /> Manage
                </Button>
              </div>

              <div className="review-completeness-row">
                <div className="completeness-score-badge">
                  <strong>{readinessScore}%</strong>
                  <span>Completeness</span>
                </div>
                <div className="completeness-text">
                  <p><strong>{uploadedDocs} of {totalDocs}</strong> required documents uploaded.</p>
                  {!allDocsUploaded ? (
                    <span className="text-danger flex-center">
                      <AlertCircle size={14} /> Complete all required documents before submission.
                    </span>
                  ) : (
                    <span className="text-success flex-center">
                      <CheckCircle2 size={14} /> All statutory documents uploaded and ready.
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Submission boundary banner */}
          <Card className="submission-boundary-card">
            <div className="boundary-left">
              <h4>First-Time-Right Intelligent Validation</h4>
              <p>
                In Phase 3, NiveshSetu will automatically run cross-document verification, entity name consistency, and fire/layout compliance checks before submitting to government departments.
              </p>
            </div>

            <div className="boundary-action">
              <Button
                size="default"
                disabled={!allDocsUploaded}
                onClick={() => setProceedSuccess(true)}
              >
                Proceed to Validation <ArrowRight size={16} />
              </Button>
            </div>
          </Card>

          {proceedSuccess && (
            <div className="proceed-success-banner">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <strong>Application Draft Completed!</strong>
                <p>All documents and business parameters saved in MongoDB. Ready for Phase 3 Smart Validation.</p>
              </div>
            </div>
          )}

          <div className="step-nav-bar mt-6">
            <Button variant="outline" onClick={() => handleStepChange(3)}>
              <ArrowLeft size={16} /> Back to Documents
            </Button>
            <Button asChild variant="outline">
              <Link to="/entrepreneur/applications">Back to My Applications</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
