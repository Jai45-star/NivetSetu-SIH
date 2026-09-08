import * as Dialog from '@radix-ui/react-dialog';
import { X, ShieldAlert, CheckCircle2, FileText, Info } from 'lucide-react';
import { Button } from '../ui/button';

export function WhyRequiredDialog({ approval, open, onOpenChange }) {
  if (!approval) return null;

  const {
    name,
    department,
    ruleId,
    reason,
    estimatedSla,
    matchedProfile = {},
    documentNames = [],
  } = approval;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="why-dialog-content">
          <div className="why-dialog-header">
            <div>
              <span className="why-rule-tag">{ruleId || 'Demo Rule'}</span>
              <Dialog.Title className="why-dialog-title">{name}</Dialog.Title>
              <Dialog.Description className="why-dialog-dept">
                Issuing Department: <strong>{department}</strong>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="why-dialog-body">
            <section className="why-box rule-explanation-box">
              <h4>
                <Info size={16} /> Explainable Regulatory Rationale
              </h4>
              <p>{reason}</p>
              {estimatedSla && (
                <div className="why-sla-tag">
                  Estimated SLA: <strong>{estimatedSla}</strong> (Demo estimate)
                </div>
              )}
            </section>

            <section className="why-box matched-profile-box">
              <h4>
                <CheckCircle2 size={16} /> Matched Business Profile Parameters
              </h4>
              <div className="profile-match-grid">
                <div>
                  <small>Industry Type</small>
                  <strong>{matchedProfile.industry || 'Food Processing'}</strong>
                </div>
                <div>
                  <small>Workforce Range</small>
                  <strong>{matchedProfile.employees || 'All ranges'}</strong>
                </div>
                <div>
                  <small>Business Stage</small>
                  <strong>{matchedProfile.stage || 'All stages'}</strong>
                </div>
                <div>
                  <small>Investment</small>
                  <strong>{matchedProfile.investment || 'All ranges'}</strong>
                </div>
              </div>
            </section>

            <section className="why-box required-docs-box">
              <h4>
                <FileText size={16} /> Associated Supporting Documents ({documentNames.length})
              </h4>
              <ul className="why-docs-list">
                {documentNames.map((doc, idx) => (
                  <li key={idx}>
                    <span className="bullet">✓</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="why-dialog-note">
              <ShieldAlert size={14} />
              <span>Prototype checklist generated from demo regulatory rules. Official verification will occur through statutory channels.</span>
            </div>
          </div>

          <div className="why-dialog-footer">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
