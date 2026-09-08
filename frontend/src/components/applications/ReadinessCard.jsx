import { CheckCircle2, ShieldCheck, Sparkles, FileCheck } from 'lucide-react';
import { Card } from '../ui/card';

export function ReadinessCard({ documents = [], readinessScore }) {
  const total = documents.length;
  const uploaded = documents.filter(d => d.status === 'uploaded' || d.status === 'valid').length;
  const percentage = typeof readinessScore === 'number' && readinessScore >= 0
    ? readinessScore
    : (total > 0 ? Math.round((uploaded / total) * 100) : 0);
  const isComplete = percentage === 100 && total > 0;

  // SVG circle calculations for radial progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="readiness-card">
      <div className="readiness-top">
        <div className="radial-progress-wrapper">
          <svg className="radial-svg" width="130" height="130" viewBox="0 0 130 130">
            <circle
              className="radial-bg"
              cx="65"
              cy="65"
              r={radius}
              strokeWidth="10"
            />
            <circle
              className={`radial-fill ${isComplete ? 'radial-complete' : ''}`}
              cx="65"
              cy="65"
              r={radius}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="radial-text">
            <span className="radial-value">{percentage}%</span>
          </div>
        </div>

        <div className="readiness-titles">
          <h3>Application Readiness</h3>
          <p className="readiness-sub">Based on required document completeness.</p>
          <div className="readiness-doc-count">
            <FileCheck size={14} />
            <span><strong>{uploaded}</strong> of <strong>{total}</strong> documents uploaded</span>
          </div>
        </div>
      </div>

      <div className="readiness-benefits">
        <h4>Once all documents are uploaded:</h4>
        <ul>
          <li>
            <CheckCircle2 size={15} className="text-success" />
            <span>100% Application Readiness reached</span>
          </li>
          <li>
            <Sparkles size={15} className="text-primary" />
            <span>Eligible to Proceed to Validation</span>
          </li>
          <li>
            <ShieldCheck size={15} className="text-success" />
            <span>Zero repeated query guarantee for standard rules</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}
