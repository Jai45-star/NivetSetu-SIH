import { date } from '../../services/workflowFormat';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workflowApi } from '../../services/workflowApi';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { WorkflowSummary, Timeline } from '../../components/workflow/Workflow';
import { ValidationReport } from '../../components/applications/ValidationReport';
import { AlertCircle, FileText, MessageSquare, RefreshCw, Clock, ArrowLeft } from 'lucide-react';
import '../../styles/workflow.css';

function QueryCard({ query, application, onRun, busy }) {
  const [response, setResponse] = useState('');
  const isOpen = query.status === 'open';
  const relatedDoc = application.documents?.find(d => d.documentId === query.documentId);

  return (
    <Card className={`wf-panel wf-query-card ${isOpen ? 'wf-query-open' : ''}`}>
      <div className="wf-row">
        <div>
          <div className="wf-query-header">
            {isOpen
              ? <span className="wf-query-badge wf-query-badge-open"><AlertCircle size={13} /> Action Required</span>
              : <span className="wf-query-badge wf-query-badge-done"><span>✓</span> Query Resolved</span>}
            <span className="wf-query-type">{query.type}</span>
          </div>
          <small>{date(query.createdAt)}</small>
        </div>
      </div>

      <p className="wf-query-message">{query.message}</p>

      {relatedDoc && (
        <p className="wf-query-doc">
          <FileText size={13} /> Requested document: <strong>{relatedDoc.name}</strong>
        </p>
      )}

      {isOpen ? (
        <form onSubmit={e => {
          e.preventDefault();
          onRun(() => workflowApi.respond(application.applicationId, { queryId: query.queryId, response }));
        }}>
          <fieldset disabled={busy} className="wf-query-form">
            {query.documentId && (
              <div className="wf-field">
                <label>
                  {query.requiresUpload
                    ? <><strong>Required:</strong> Upload replacement document</>
                    : 'Replace requested document (optional)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) onRun(() => workflowApi.upload(application.applicationId, query, f));
                    e.target.value = '';
                  }}
                />
                <small>Uploads are automatically revalidated. Only the requested document may change.</small>
                {query.uploadedAt && (
                  <small className="wf-text-success">✓ Replacement saved {date(query.uploadedAt)}</small>
                )}
              </div>
            )}

            <div className="wf-field">
              <label htmlFor={`response-${query.queryId}`}>Your response <span style={{color:'var(--danger)'}}>*</span></label>
              <textarea
                id={`response-${query.queryId}`}
                required
                maxLength={4000}
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Explain how you addressed this query…"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={busy}>
              {busy ? <><RefreshCw size={14} className="wf-spin" /> Checking…</> : 'Validate and Send Response'}
            </Button>
          </fieldset>
        </form>
      ) : (
        <blockquote className="wf-query-response">
          <div className="wf-row">
            <strong>Your response</strong>
            <small>{date(query.respondedAt)}</small>
          </div>
          <p>{query.response}</p>
        </blockquote>
      )}
    </Card>
  );
}

export function ApplicationTracking({ application }) {
  const [a, setA] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    workflowApi.tracking(application.applicationId)
      .then(data => { if (active) setA(data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [application.applicationId]);

  const run = async task => {
    setBusy(true);
    setError('');
    try {
      const result = await task();
      setA(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!a) {
    return (
      <div className="wf-page wf-loading-state" role="status">
        {error
          ? <><AlertCircle size={20} /><p>{error}</p></>
          : <><RefreshCw size={20} className="wf-spin" /><p>Loading application tracking…</p></>}
      </div>
    );
  }

  const openQueries = a.queries?.filter(q => q.status === 'open') || [];
  const resolvedQueries = a.queries?.filter(q => q.status === 'responded') || [];
  const publicRemarks = a.workflowEvents?.filter(e => e.remark) || [];
  const isTerminal = ['approved', 'rejected'].includes(a.status);

  return (
    <div className="wf-page">
      {/* Back link */}
      <Link to="/entrepreneur/applications" className="wf-back-link">
        <ArrowLeft size={15} /> My Applications
      </Link>

      {/* Page header */}
      <header className="wf-tracking-header">
        <div>
          <span className="eyebrow">APPLICATION TRACKING</span>
          <h1>{a.unitName}</h1>
          <p className="wf-tracking-meta">
            {a.applicationId}
            {a.businessProfile?.industryType && <> · {a.businessProfile.industryType}</>}
            {a.businessProfile?.location && <> · {a.businessProfile.location}</>}
          </p>
          <small className="wf-muted">{a.integrationLabel}</small>
        </div>
      </header>

      {/* Errors */}
      {error && <p role="alert" className="wf-error"><AlertCircle size={15} /> {error}</p>}

      {/* Workflow Summary (Stepper + metrics + bottleneck) */}
      <WorkflowSummary application={a} />

      {/* Open officer queries — action required */}
      {openQueries.length > 0 && (
        <section aria-label="Officer queries requiring your response">
          <h2 className="wf-section-heading">
            <AlertCircle size={17} /> Officer Queries — Action Required <span className="wf-count">{openQueries.length}</span>
          </h2>
          {openQueries.map(q => (
            <QueryCard
              key={q.queryId}
              query={q}
              application={a}
              onRun={run}
              busy={busy}
            />
          ))}
        </section>
      )}

      {/* Department remarks */}
      <Card className="wf-panel">
        <h2><MessageSquare size={16} /> Department Remarks</h2>
        {publicRemarks.length > 0
          ? publicRemarks.map(e => (
            <blockquote key={e.eventId} className="wf-remark">
              <p>{e.remark}</p>
              <small>— {e.actor?.name}, {date(e.at)}</small>
            </blockquote>
          ))
          : <p>No public department remarks yet.</p>}
      </Card>

      {/* Timeline + Documents side by side */}
      <div className="wf-columns">
        <Timeline events={a.workflowEvents || []} />

        <Card className="wf-panel">
          <h2><FileText size={16} /> Submitted Documents</h2>
          <div className="wf-doc-list">
            {(a.documents || []).map(d => (
              <div key={d.documentId} className="wf-doc-item">
                <div className="wf-row">
                  <span>{d.name}</span>
                  {d.storedName
                    ? <a
                        href={`/api/applications/${a.applicationId}/documents/${d.documentId}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="wf-view-link"
                      >
                        View
                      </a>
                    : <span className="wf-muted">No file</span>}
                </div>
                <small className={`wf-doc-status wf-doc-${d.validation?.status || d.status}`}>
                  {d.validation?.status?.replaceAll('_', ' ') || d.status || 'Not validated'}
                </small>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resolved queries */}
      {resolvedQueries.length > 0 && (
        <section aria-label="Resolved officer queries">
          <h2 className="wf-section-heading">
            <Clock size={17} /> Resolved Queries <span className="wf-count">{resolvedQueries.length}</span>
          </h2>
          {resolvedQueries.map(q => (
            <QueryCard
              key={q.queryId}
              query={q}
              application={a}
              onRun={run}
              busy={busy}
            />
          ))}
        </section>
      )}

      {/* Validation report (collapsed by default for submitted apps) */}
      {a.validationReport && (
        <ValidationReport report={a.validationReport} readOnly />
      )}
    </div>
  );
}
