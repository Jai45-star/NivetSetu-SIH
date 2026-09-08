import { date, days } from '../../services/workflowFormat';
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, FileText, User, MessageSquare, BarChart2,
  ShieldAlert, Activity,
} from 'lucide-react';
import { workflowApi } from '../../services/workflowApi';
import { WorkflowBadge, WorkflowSummary, Timeline } from '../../components/workflow/Workflow';
import { ValidationReport } from '../../components/applications/ValidationReport';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import '../../styles/workflow.css';

/* ─── Helpers ─────────────────────────────────────────────────── */
const isTerminal = a => ['approved', 'rejected'].includes(a.status);
const isActive = a => !isTerminal(a);

const SLA_RANK = { BREACHED: 0, AT_RISK: 1, ATTENTION: 2, SAFE: 3 };
function slaClass(status) {
  return {
    BREACHED: 'wf-sla-breached',
    AT_RISK: 'wf-sla-risk',
    ATTENTION: 'wf-sla-attention',
    SAFE: 'wf-sla-safe',
  }[status] || '';
}

/* ─── KPI metric row ───────────────────────────────────────────── */
function Metrics({ items }) {
  return (
    <div className="wf-kpis">
      {items.map(([label, value, tone]) => (
        <Card key={label} className={`wf-kpi-card ${tone ? `wf-kpi-${tone}` : ''}`}>
          <small>{label}</small>
          <strong>{value ?? '—'}</strong>
        </Card>
      ))}
    </div>
  );
}

/* ─── Workflow Load Bars ───────────────────────────────────────── */
function WorkflowLoad({ applications }) {
  const stages = ['Document Verification', 'Technical Scrutiny', 'Final Decision'];
  const counts = stages.map(name => [name, applications.filter(a => isActive(a) && a.currentStage === name).length]);
  const max = Math.max(1, ...counts.map(([, n]) => n));
  return (
    <Card className="wf-panel">
      <h2>Current Workflow Load</h2>
      <p className="wf-muted">Applications waiting in each review stage. Demo workspace snapshot.</p>
      <div className="wf-load">
        {counts.map(([name, count]) => (
          <div key={name}>
            <div className="wf-row">
              <span>{name}</span>
              <strong>
                {count}
                {count === max && count > 0 ? <span className="wf-load-peak"> · Highest load</span> : null}
              </strong>
            </div>
            <div className="wf-track" role="progressbar" aria-valuenow={count} aria-valuemax={max} aria-label={`${name}: ${count} applications`}>
              <span style={{ width: `${count / max * 100}%`, background: count === max && count > 0 ? 'var(--warning)' : undefined }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Application table row ────────────────────────────────────── */
function AppRow({ a, slaMode }) {
  const sla = a.sla;
  const paused = sla?.paused;
  const remainText = paused
    ? 'SLA paused'
    : sla?.remainingDays < 0
    ? `Breached by ${days(-sla.remainingDays)}`
    : `${days(sla?.remainingDays)} remaining`;

  return (
    <tr>
      <td>
        <strong>{a.unitName}</strong>
        <small>{a.applicationId} · {a.businessProfile?.industryType}</small>
      </td>
      <td>
        {slaMode
          ? <span>{days(sla?.elapsedDays)} / {days(sla?.slaDays)}</span>
          : <><span>{a.readinessScore}%</span><small>{a.validationStatus === 'passed' ? '✓ Pre-validation passed' : 'Needs review'}</small></>}
      </td>
      <td>
        {a.currentStage}
        {a.bottleneckReason && <small>{a.bottleneckReason}</small>}
      </td>
      <td>
        <WorkflowBadge status={sla?.slaStatus} />
        <small className={sla?.remainingDays < 0 ? 'wf-text-danger' : paused ? 'wf-text-warning' : ''}>
          {remainText}
        </small>
      </td>
      <td><WorkflowBadge status={a.status} /></td>
      <td>
        <Link className="wf-review-link" to={`/officer/applications/${a.applicationId}`}>
          Review <ArrowRight size={14} />
        </Link>
      </td>
    </tr>
  );
}

/* ─── Priority indicator for review queue ─────────────────────── */
function PriorityBadge({ application: a }) {
  const sla = a.sla;
  if (sla?.slaStatus === 'BREACHED') return <span className="wf-priority wf-priority-high">HIGH · SLA breached by {days(-sla.remainingDays)}</span>;
  if (sla?.slaStatus === 'AT_RISK') return <span className="wf-priority wf-priority-high">HIGH · {days(sla.remainingDays)} remaining</span>;
  if (sla?.slaStatus === 'ATTENTION') return <span className="wf-priority wf-priority-med">MEDIUM · {days(sla.remainingDays)} remaining</span>;
  if (a.workflow?.applicantActionRequired) return <span className="wf-priority wf-priority-med">WAITING FOR APPLICANT</span>;
  return <span className="wf-priority wf-priority-low">NORMAL</span>;
}

/* ─── Applications Table ───────────────────────────────────────── */
function AppTable({ applications, slaMode, reviewMode }) {
  return (
    <Card className="table-card">
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Application review queue">
        <table>
          <caption>
            Prototype applications{reviewMode ? ' · prioritized by demo SLA urgency' : ''} · Demo SLA policies, no live government connection
          </caption>
          <thead>
            <tr>
              <th scope="col">Applicant / Unit</th>
              <th scope="col">{slaMode ? 'Elapsed / SLA' : 'Pre-validation'}</th>
              <th scope="col">Current Stage</th>
              <th scope="col">SLA Status</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(a => <AppRow key={a.applicationId} a={a} slaMode={slaMode} />)}
          </tbody>
        </table>
        {!applications.length && <p className="wf-empty">No applications match this view.</p>}
      </div>
    </Card>
  );
}

/* ─── Reports page ─────────────────────────────────────────────── */
function ReportsView({ stats }) {
  return (
    <>
      <Metrics items={[
        ['Applications Processed', stats.processed, 'primary'],
        ['Average Stage Time', stats.averageStageDays == null ? '—' : days(stats.averageStageDays), null],
        ['SLA Breaches (any stage)', stats.breaches, stats.breaches > 0 ? 'danger' : null],
        ['Average Query Cycles', stats.averageQueryCycles?.toFixed(1), null],
        ['First-Time-Right Rate', stats.firstTimeRightRate == null ? '—' : `${stats.firstTimeRightRate.toFixed(0)}%`, null],
      ]} />
      <Card className="wf-panel">
        <h2>How These Prototype Metrics Are Calculated</h2>
        <p><strong>First-Time-Right</strong> = completed applications that passed NiveshSetu pre-validation at submission and had no officer query marked as an avoidable document or application error, divided by all completed applications.</p>
        <p>Average stage time uses completed stages, excluding legacy records with unavailable timings. SLA breaches count applications with any breached stage. Query cycles are averaged across all submitted applications. An empty denominator displays "—".</p>
      </Card>
    </>
  );
}

/* ─── Main Officer Workspace ────────────────────────────────────── */
const FILTER_OPTIONS = ['All', 'Under Review', 'Needs Attention', 'Breached', 'Applicant Action', 'Approved'];

export function OfficerWorkspace({ mode = 'dashboard' }) {
  const [applications, setApplications] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [apps, analytics] = await Promise.all([workflowApi.list(), workflowApi.analytics()]);
      setApplications(apps);
      setStats(analytics);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TITLES = {
    dashboard: 'Officer Dashboard',
    applications: 'All Applications',
    review: 'Priority Review Queue',
    sla: 'SLA Monitoring',
    reports: 'Workflow Reports',
  };

  const pending = (applications || []).filter(isActive);
  const counts = Object.fromEntries(
    ['SAFE', 'ATTENTION', 'AT_RISK', 'BREACHED'].map(s => [
      s, pending.filter(a => !a.sla?.paused && a.sla?.slaStatus === s).length,
    ])
  );

  const visible = (applications || [])
    .filter(a => mode === 'review' || mode === 'sla' ? isActive(a) : true)
    .filter(a => {
      if (filter === 'All') return true;
      if (filter === 'Under Review') return ['under_review', 'at_risk'].includes(a.status);
      if (filter === 'Needs Attention') return isActive(a) && !a.sla?.paused && ['ATTENTION', 'AT_RISK', 'BREACHED'].includes(a.sla?.slaStatus);
      if (filter === 'Breached') return isActive(a) && !a.sla?.paused && a.sla?.slaStatus === 'BREACHED';
      if (filter === 'Applicant Action') return a.workflow?.applicantActionRequired;
      if (filter === 'Approved') return a.status === 'approved';
      return true;
    });

  const dashboardMetrics = [
    ['Total Applications', stats?.total, 'primary'],
    ['Under Review', stats?.underReview, null],
    ['Needs Attention', stats?.needsAttention, stats?.needsAttention > 0 ? 'warning' : null],
    ['Breached', counts.BREACHED, counts.BREACHED > 0 ? 'danger' : null],
    ['Applicant Pending', stats?.applicantPending, null],
  ];

  const slaMetrics = [
    ['Safe', counts.SAFE, null],
    ['Needs Attention', counts.ATTENTION, counts.ATTENTION > 0 ? 'warning' : null],
    ['At Risk', counts.AT_RISK, counts.AT_RISK > 0 ? 'warning' : null],
    ['Breached', counts.BREACHED, counts.BREACHED > 0 ? 'danger' : null],
  ];

  return (
    <div className="wf-page">
      {/* Header */}
      <header className="wf-row">
        <div>
          <span className="eyebrow">INDUSTRY FACILITATION · DEMO DEPARTMENT</span>
          <h1>{TITLES[mode]}</h1>
          <p>Review applications and keep the approval process moving.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={busy}>
          <RefreshCw size={15} className={busy ? 'wf-spin' : ''} />
          {busy ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>

      <p className="wf-muted wf-disclaimer">
        Prototype / Mock Government Workflow · Demo SLA policies · No live government connection
      </p>

      {error && <p role="alert" className="wf-error"><AlertTriangle size={14} /> {error}</p>}
      {!applications && !error && <p role="status"><RefreshCw size={14} className="wf-spin" /> Loading officer workspace…</p>}

      {/* Reports mode */}
      {applications && mode === 'reports' && stats && <ReportsView stats={stats} />}

      {/* All other modes */}
      {applications && mode !== 'reports' && stats && (
        <>
          <Metrics items={mode === 'sla' ? slaMetrics : dashboardMetrics} />

          <section>
            <div className="wf-row wf-section-row">
              <h2>{mode === 'review' ? 'Applications by Urgency' : 'Application Overview'}</h2>
              <span className="wf-muted">{visible.length} applications</span>
            </div>

            {mode === 'review' && (
              <p className="wf-muted">
                Order: SLA breached → at risk → needs attention → safe → waiting for applicant. Completed applications are shown last.
              </p>
            )}

            {/* Filters */}
            <div className="wf-filters" role="group" aria-label="Filter applications">
              {FILTER_OPTIONS.map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  size="sm"
                >
                  {f}
                </Button>
              ))}
            </div>

            {/* Review-mode priority list */}
            {mode === 'review' && visible.length > 0 && (
              <div className="wf-priority-list">
                {visible.map(a => (
                  <Card key={a.applicationId} className={`wf-priority-item ${slaClass(a.sla?.slaStatus)}`}>
                    <div className="wf-priority-left">
                      <PriorityBadge application={a} />
                      <strong>{a.unitName}</strong>
                      <small>{a.applicationId} · {a.businessProfile?.industryType} · {a.currentStage}</small>
                      <small className="wf-muted">{a.bottleneckReason}</small>
                    </div>
                    <div className="wf-priority-right">
                      <WorkflowBadge status={a.sla?.slaStatus} />
                      <Link className="wf-review-link" to={`/officer/applications/${a.applicationId}`}>
                        Review <ArrowRight size={14} />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Regular table for non-review modes */}
            {mode !== 'review' && <AppTable applications={visible} slaMode={mode === 'sla'} reviewMode={false} />}
            {mode === 'review' && visible.length === 0 && <p className="wf-empty">No applications match this filter.</p>}
          </section>

          <WorkflowLoad applications={applications} />
        </>
      )}
    </div>
  );
}

/* ─── Officer Action Dialog ────────────────────────────────────── */
const ACTION_LABELS = {
  'start-review': 'Start Review',
  'advance-stage': 'Move to Next Stage',
  query: 'Raise Query',
  approve: 'Approve Application',
  reject: 'Reject Application',
  note: 'Add Internal Note',
};
const QUERY_TYPES = ['Document Clarification', 'Information Mismatch', 'Additional Information', 'Other'];
const REJECT_CATEGORIES = ['Documentation', 'Eligibility', 'Technical requirements', 'Other'];

function OfficerActions({ a, onUpdate }) {
  const [action, setAction] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError('');
    try {
      onUpdate(await workflowApi.action(a.applicationId, action, {
        ...values,
        expectedStage: a.workflow.currentStage,
        avoidableError: values.avoidableError === 'on',
        requiresUpload: values.requiresUpload === 'on',
      }));
      setAction(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const terminal = isTerminal(a);
  const paused = a.workflow?.applicantActionRequired;
  const stage = a.workflow?.currentStage;

  const availableActions = terminal ? [] : stage === 'submitted'
    ? ['start-review']
    : stage === 'decision'
    ? ['query', 'approve', 'reject', 'note']
    : ['advance-stage', 'query', 'note'];

  return (
    <Card className="wf-panel">
      <div className="wf-row">
        <h2>Officer Actions</h2>
        <div>
          <small><strong>R. Deshmukh</strong> · Demo Industry Department</small>
        </div>
      </div>

      {terminal ? (
        <p>Final decision recorded. No further workflow transitions are available.</p>
      ) : (
        <>
          <div className="wf-actions">
            {availableActions.map(key => (
              <Button
                key={key}
                variant={['reject'].includes(key) ? 'outline' : key === 'query' || key === 'note' ? 'outline' : 'default'}
                disabled={paused && !['note'].includes(key)}
                onClick={() => { setError(''); setAction(key); }}
                className={key === 'approve' ? 'wf-btn-approve' : key === 'reject' ? 'wf-btn-reject' : ''}
              >
                {ACTION_LABELS[key]}
              </Button>
            ))}
          </div>
          {paused && (
            <p className="wf-alert">
              <AlertTriangle size={14} /> SLA paused — waiting for applicant response. Stage and decision actions are paused.
            </p>
          )}
        </>
      )}

      {/* Action Dialog */}
      <Dialog.Root open={!!action} onOpenChange={open => { if (!open && !busy) setAction(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="wf-dialog-overlay" />
          <Dialog.Content className="wf-dialog" aria-describedby="dialog-desc">
            <Dialog.Title>{ACTION_LABELS[action]}</Dialog.Title>
            <Dialog.Description id="dialog-desc">
              Changes are recorded in the application audit history. All decisions are prototype decisions, not official government approvals.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="wf-dialog-close" disabled={busy} aria-label="Close dialog"><X /></button>
            </Dialog.Close>

            <form onSubmit={submit}>
              <fieldset disabled={busy}>
                {/* Query fields */}
                {action === 'query' && (
                  <>
                    <label className="wf-field">
                      Query type <span className="wf-req">*</span>
                      <select name="type" required>
                        {QUERY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </label>
                    <label className="wf-field">
                      Message to applicant <span className="wf-req">*</span>
                      <textarea name="message" required maxLength={4000} rows={4} />
                    </label>
                    <label className="wf-field">
                      Related document
                      <select name="documentId">
                        <option value="">No specific document requested</option>
                        {a.documents.map(d => (
                          <option value={d.documentId} key={d.documentId}>{d.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="wf-check">
                      <input type="checkbox" name="requiresUpload" />
                      Require a replacement document upload
                    </label>
                    <label className="wf-check">
                      <input type="checkbox" name="avoidableError" />
                      Query concerns an avoidable document/application error (affects First-Time-Right KPI)
                    </label>
                  </>
                )}

                {/* Reject fields */}
                {action === 'reject' && (
                  <>
                    <label className="wf-field">
                      Reason category <span className="wf-req">*</span>
                      <select name="category" required>
                        <option value="">Select reason category</option>
                        {REJECT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="wf-field">
                      Detailed rejection reason <span className="wf-req">*</span>
                      <textarea name="reason" required maxLength={4000} rows={4} placeholder="Provide a clear, actionable reason for the applicant." />
                    </label>
                  </>
                )}

                {/* Note field */}
                {action === 'note' && (
                  <label className="wf-field">
                    Internal note (officer-only, not visible to applicant)
                    <textarea name="message" required maxLength={4000} rows={3} />
                  </label>
                )}

                {/* Optional remark for non-note, non-query actions */}
                {action && action !== 'query' && action !== 'note' && (
                  <label className="wf-field">
                    Public department remark (optional — visible to applicant)
                    <textarea name="remark" maxLength={4000} rows={2} />
                  </label>
                )}

                {error && <p role="alert" className="wf-error"><AlertTriangle size={13} /> {error}</p>}

                <div className="wf-actions" style={{ marginTop: 16 }}>
                  <Button type="submit" className={action === 'approve' ? 'wf-btn-approve' : action === 'reject' ? 'wf-btn-reject' : ''}>
                    {busy ? <><RefreshCw size={13} className="wf-spin" /> Saving…</> : `Confirm: ${ACTION_LABELS[action] || ''}`}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAction(null)}>
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}

/* ─── Application Review Page ───────────────────────────────────── */
export function ApplicationReview() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    workflowApi.detail(id)
      .then(data => { if (active) setA(data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);

  if (!a) return (
    <div className="wf-page" role="status">
      {error
        ? <p className="wf-error"><AlertTriangle size={14} /> {error}</p>
        : <p><RefreshCw size={14} className="wf-spin" /> Loading application review…</p>}
    </div>
  );

  if (!a.workflow) return (
    <div className="wf-page">
      <Link to="/officer/applications" className="wf-back-link">← Applications</Link>
      <h1>Draft Application</h1>
      <p>This application has not been submitted yet and cannot be reviewed.</p>
    </div>
  );

  return (
    <div className="wf-page">
      <Link to="/officer/review" className="wf-back-link">← Review Queue</Link>

      <header className="wf-tracking-header">
        <div>
          <span className="eyebrow">APPLICATION REVIEW · OFFICER VIEW</span>
          <h1>{a.unitName}</h1>
          <p className="wf-tracking-meta">
            {a.applicationId} · Submitted {date(a.submittedAt)}
          </p>
          <small className="wf-muted">{a.integrationLabel}</small>
        </div>
        <WorkflowBadge status={a.status} />
      </header>

      {error && <p role="alert" className="wf-error"><AlertTriangle size={14} /> {error}</p>}

      {/* Workflow summary + stepper */}
      <WorkflowSummary application={a} />

      {/* Officer action panel */}
      <OfficerActions a={a} onUpdate={setA} />

      {/* Business profile + required approvals */}
      <div className="wf-columns">
        <Card className="wf-panel">
          <h2><User size={16} /> Business Profile</h2>
          <dl className="wf-profile">
            {Object.entries(a.businessProfile || {})
              .filter(([key]) => key !== '_id' && key !== '__v')
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd>{value || '—'}</dd>
                </div>
              ))}
          </dl>
        </Card>

        <Card className="wf-panel">
          <h2><CheckCircle2 size={16} /> Required Approvals</h2>
          {a.requiredApprovals?.map(r => (
            <div key={r.id} className="wf-approval-item">
              <strong>{r.name}</strong>
              <small>{r.department} · {r.estimatedSla}</small>
            </div>
          ))}
          {!a.requiredApprovals?.length && <p>No approval requirements found.</p>}
        </Card>
      </div>

      {/* NiveshSetu Pre-Validation Summary */}
      <Card className="wf-panel wf-prevalidation-summary">
        <div className="wf-row">
          <div>
            <span className="eyebrow">NIVESHSETU PRE-VALIDATION</span>
            <h2>
              {a.validationStatus === 'passed'
                ? <><CheckCircle2 size={18} className="wf-icon-success" /> Passed</>
                : <><AlertTriangle size={18} className="wf-icon-warning" /> Needs Review</>}
            </h2>
            <p>Readiness: <strong>{a.readinessScore}%</strong></p>
          </div>
          <div className="wf-prevalidation-note">
            NiveshSetu assists document scrutiny. Final verification remains with the authorized officer.
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="wf-panel">
        <h2><FileText size={16} /> Documents &amp; Extracted Fields</h2>
        <div className="wf-documents">
          {(a.documents || []).map(d => (
            <article key={d.documentId} className={`wf-doc-review-card ${d.validation?.status === 'manual_review' ? 'wf-doc-manual' : ''}`}>
              <div className="wf-row">
                <div>
                  <strong>{d.name}</strong>
                  {d.validation?.status === 'manual_review' && (
                    <span className="wf-manual-badge"><AlertTriangle size={11} /> Manual Review</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!d.storedName}
                  onClick={() => workflowApi.viewFile(a.applicationId, d.documentId).catch(e => setError(e.message))}
                >
                  View Original
                </Button>
              </div>
              <p className="wf-doc-filename">
                {d.originalName || 'No file uploaded'} ·{' '}
                <span className={`wf-validation-label wf-val-${d.validation?.status || 'not_uploaded'}`}>
                  {d.validation?.status?.replaceAll('_', ' ') || 'Not validated'}
                </span>
              </p>
              {d.extraction?.extractedFields && Object.keys(d.extraction.extractedFields).length > 0 && (
                <dl className="wf-profile">
                  {Object.entries(d.extraction.extractedFields).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          ))}
        </div>
      </Card>

      {/* Pre-validation report */}
      <ValidationReport report={a.validationReport} readOnly />

      {/* Query history */}
      <Card className="wf-panel">
        <h2><MessageSquare size={16} /> Query History · {a.queryCount || 0} cycle{a.queryCount !== 1 ? 's' : ''}</h2>
        {!a.queries?.length && <p>No officer queries raised on this application.</p>}
        {(a.queries || []).map(q => (
          <article className="wf-query" key={q.queryId}>
            <div className="wf-row">
              <strong>{q.type} · {q.status === 'open' ? 'Waiting for Applicant' : 'Applicant Responded'}</strong>
              <small>{date(q.createdAt)}</small>
            </div>
            <p>{q.message}</p>
            <small>Avoidable error: {q.avoidableError ? 'Yes (affects First-Time-Right KPI)' : 'No'}</small>
            {q.response && (
              <blockquote>
                <strong>Applicant response</strong>
                <p>{q.response}</p>
                <small>{date(q.respondedAt)}</small>
              </blockquote>
            )}
          </article>
        ))}
      </Card>

      {/* Internal notes (officer only) */}
      <Card className="wf-panel">
        <h2>Internal Notes · Officers Only</h2>
        {a.internalNotes?.length
          ? a.internalNotes.map((n, i) => (
            <p key={i}>
              {n.text}
              <small>{n.actor?.name} · {date(n.at)}</small>
            </p>
          ))
          : <p>No internal notes added.</p>}
      </Card>

      {/* Audit timeline */}
      <Timeline events={a.workflowEvents || []} />
    </div>
  );
}
