import { StatusBadge } from '../shared/StatusBadge';

const STATUS_CONFIG = {
  draft: { label: 'Draft', tone: 'warning' },
  ready_for_validation: { label: 'Ready for Validation', tone: 'primary' },
  submitted: { label: 'Submitted', tone: 'primary' },
  under_review: { label: 'Under Review', tone: 'primary' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  action_required: { label: 'Action Required', tone: 'warning' },
  at_risk: { label: 'SLA Risk', tone: 'danger' },
};

export function ApplicationStatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || { label: status || 'Draft', tone: 'primary' };
  return (
    <StatusBadge tone={config.tone} className={className}>
      {config.label}
    </StatusBadge>
  );
}
