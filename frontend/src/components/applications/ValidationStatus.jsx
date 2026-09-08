import { CheckCircle2, AlertTriangle, CircleX, ScanSearch, LoaderCircle, FileQuestion } from 'lucide-react';
const states = {
  not_uploaded: { label: 'Not uploaded', tone: 'danger', icon: FileQuestion },
  processing: { label: 'Checking document', tone: 'primary', icon: LoaderCircle },
  valid: { label: 'Pre-validation passed', tone: 'success', icon: CheckCircle2 },
  warning: { label: 'Needs applicant review', tone: 'warning', icon: AlertTriangle },
  invalid: { label: 'Issue found', tone: 'danger', icon: CircleX },
  manual_review: { label: 'Manual review', tone: 'warning', icon: ScanSearch },
  uploaded: { label: 'Uploaded · not checked', tone: 'primary', icon: FileQuestion },
};
export function ValidationStatus({ status }) {
  const { label, tone, icon: Icon } = states[status] || states.uploaded;
  return <span className={`validation-status tone-${tone}`}><Icon size={14} aria-hidden="true"/>{label}</span>;
}
