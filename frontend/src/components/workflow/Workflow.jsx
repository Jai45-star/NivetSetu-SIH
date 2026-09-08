import { date, days } from '../../services/workflowFormat';
import { CheckCircle2, Circle, Clock3, AlertTriangle, XCircle, CheckCheck } from 'lucide-react';
import { Card } from '../ui/card';

// Human-readable event type labels for the timeline
const EVENT_LABELS = {
  APPLICATION_SUBMITTED: 'Application Submitted',
  REVIEW_STARTED: 'Review Started',
  STAGE_CHANGED: 'Stage Advanced',
  QUERY_RAISED: 'Officer Query Raised',
  QUERY_RESPONDED: 'Applicant Responded',
  APPLICANT_DOCUMENT_REPLACED: 'Document Replaced',
  APPLICATION_APPROVED: 'Application Approved',
  APPLICATION_REJECTED: 'Application Rejected',
  SLA_WARNING: 'SLA Warning Issued',
  SLA_BREACHED: 'SLA Deadline Breached',
  INTERNAL_NOTE_ADDED: 'Internal Note Added',
  WORKFLOW_INITIALIZED: 'Workflow Initialized',
};

const STATUS_LABELS = {
  SAFE: 'Safe',
  ATTENTION: 'Needs Attention',
  AT_RISK: 'At Risk',
  BREACHED: 'Deadline Breached',
  action_required: 'Action Required',
  under_review: 'Under Review',
  at_risk: 'Under Review',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  draft: 'Draft',
};

export function WorkflowBadge({ status }) {
  const label = STATUS_LABELS[status] || status?.replaceAll('_', ' ');
  const Icon =
    status === 'approved' || status === 'SAFE' ? CheckCircle2
    : status === 'rejected' ? XCircle
    : ['BREACHED', 'AT_RISK', 'ATTENTION', 'action_required'].includes(status) ? AlertTriangle
    : Clock3;
  return (
    <span className={`wf-badge wf-${status}`}>
      <Icon size={13} />
      {label || 'Pending'}
    </span>
  );
}

export function WorkflowStepper({ workflow }) {
  return (
    <ol className="wf-stepper" aria-label="Application stages">
      {workflow.stages.map(s => (
        <li key={s.stageId} className={s.status} aria-current={s.status === 'in_progress' ? 'step' : undefined}>
          {s.status === 'completed'
            ? <CheckCircle2 size={18} aria-hidden="true" />
            : s.status === 'in_progress'
            ? <Clock3 size={18} aria-hidden="true" />
            : <Circle size={18} aria-hidden="true" />}
          <div>
            <strong>{s.name}</strong>
            <small>{s.status === 'in_progress' ? 'In Progress' : s.status === 'completed' ? 'Completed' : 'Pending'}</small>
            {s.startedAt && s.status === 'in_progress' && (
              <small className="wf-stage-since">Since {date(s.startedAt)}</small>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ events }) {
  return (
    <Card className="wf-panel">
      <h2>Application Timeline</h2>
      <ol className="wf-timeline">
        {[...events].reverse().map(e => (
          <li key={e.eventId}>
            <span
              className={`wf-timeline-dot ${
                e.type === 'APPLICATION_APPROVED' ? 'dot-approved'
                : e.type === 'APPLICATION_REJECTED' ? 'dot-rejected'
                : e.type === 'QUERY_RAISED' || e.type === 'SLA_WARNING' || e.type === 'SLA_BREACHED' ? 'dot-warning'
                : ''
              }`}
            />
            <div>
              <strong>{EVENT_LABELS[e.type] || e.type.replaceAll('_', ' ')}</strong>
              {e.message && <p>{e.message}</p>}
              {e.remark && <p className="wf-timeline-remark">Department remark: "{e.remark}"</p>}
              <small>{e.actor?.name} · {date(e.at)}</small>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function WorkflowSummary({ application: a }) {
  const terminal = ['approved', 'rejected'].includes(a.status);
  const isApproved = a.status === 'approved';
  const isRejected = a.status === 'rejected';

  return (
    <>
      <Card className={`wf-panel wf-summary-card ${isApproved ? 'wf-summary-approved' : isRejected ? 'wf-summary-rejected' : ''}`}>
        <div className="wf-row">
          <div>
            <span className="eyebrow">CURRENT STAGE</span>
            <h2>{a.currentStage}</h2>
            <p>
              {isApproved
                ? 'Prototype decision: Application approved.'
                : isRejected
                ? 'Prototype decision: Application rejected.'
                : a.workflow.applicantActionRequired
                ? 'Your response is needed before review can continue.'
                : 'Your application is in the department review workflow.'}
            </p>
          </div>
          <WorkflowBadge status={a.status} />
        </div>

        {/* 4 Key Metrics */}
        <div className="wf-metrics">
          <div>
            <small>Pending Since</small>
            <strong>{days(a.sla?.elapsedDays)}</strong>
          </div>
          <div>
            <small>Demo Stage SLA</small>
            <strong>{days(a.sla?.slaDays)}</strong>
          </div>
          <div>
            <small>{a.sla?.remainingDays < 0 ? 'Breached by' : 'Remaining'}</small>
            <strong className={a.sla?.remainingDays < 0 ? 'wf-text-danger' : a.sla?.slaStatus === 'AT_RISK' ? 'wf-text-warning' : ''}>
              {days(Math.abs(a.sla?.remainingDays ?? 0))}
            </strong>
          </div>
          <div>
            <small>Applicant Action</small>
            <strong className={a.workflow.applicantActionRequired ? 'wf-text-warning' : ''}>
              {a.workflow.applicantActionRequired ? 'Required' : 'None'}
            </strong>
          </div>
        </div>

        <WorkflowStepper workflow={a.workflow} />

        {a.sla?.paused
          ? <p className="wf-alert">⏸ SLA paused — waiting for applicant response. Due date shifts while paused.</p>
          : !terminal && (
            <p className="wf-muted">Stage due {date(a.sla?.dueAt)} · UTC calendar duration; weekends included. Prototype SLA.</p>
          )}
        {terminal && (
          <p className="wf-muted">
            Total prototype processing time: {days(a.processingDays)}. This is not an official government approval or certificate.
          </p>
        )}
      </Card>

      {/* Bottleneck Signal Card — only for active applications */}
      {!terminal && (
        <Card className={`wf-signal wf-signal-${a.sla?.slaStatus || 'SAFE'}`}>
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>{a.bottleneckStatus}</strong>
            <p>{a.bottleneckReason}</p>
          </div>
          <WorkflowBadge status={a.sla?.slaStatus} />
        </Card>
      )}

      {/* Approved decision card */}
      {isApproved && (
        <Card className="wf-decision-card wf-decision-approved">
          <CheckCheck size={28} />
          <div>
            <h2>Application Approved</h2>
            <p>Prototype workflow decision — not an official government approval or certificate. Final verification remains with the authorized officer.</p>
          </div>
        </Card>
      )}

      {/* Rejected decision card */}
      {isRejected && a.rejection && (
        <Card className="wf-decision-card wf-decision-rejected">
          <XCircle size={28} />
          <div>
            <h2>Application Rejected · {a.rejection.category}</h2>
            <p>{a.rejection.reason}</p>
            <p className="wf-muted">Prototype workflow decision — not an official government order. You may begin a new application.</p>
          </div>
        </Card>
      )}
    </>
  );
}
