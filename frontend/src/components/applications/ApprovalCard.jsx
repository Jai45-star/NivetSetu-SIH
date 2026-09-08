import { useState } from 'react';
import { Landmark, FileText, Clock, Info } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from '../shared/StatusBadge';
import { WhyRequiredDialog } from './WhyRequiredDialog';

export function ApprovalCard({ approval }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    name,
    department,
    reason,
    estimatedSla,
    documentCount = 0,
    status = 'Required',
  } = approval;

  return (
    <>
      <Card className="approval-card">
        <div className="approval-card-top">
          <div className="approval-header-left">
            <div className="approval-icon">
              <Landmark size={22} />
            </div>
            <div>
              <h3>{name}</h3>
              <p className="approval-dept">{department}</p>
            </div>
          </div>
          <StatusBadge tone="primary">{status}</StatusBadge>
        </div>

        <p className="approval-reason">{reason}</p>

        <div className="approval-meta">
          <span className="approval-meta-item">
            <FileText size={14} />
            <strong>{documentCount}</strong> Documents required
          </span>
          {estimatedSla && (
            <span className="approval-meta-item">
              <Clock size={14} />
              <span>Demo SLA: <strong>{estimatedSla}</strong></span>
            </span>
          )}
        </div>

        <div className="approval-card-action">
          <Button
            variant="outline"
            size="default"
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Info size={14} /> View Requirements
          </Button>
        </div>
      </Card>

      <WhyRequiredDialog
        approval={approval}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
