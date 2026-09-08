import { Link } from 'react-router-dom';
import { Factory, MapPin, ArrowRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

export function ApplicationCard({ application }) {
  const {
    applicationId,
    unitName,
    businessProfile = {},
    status = 'draft',
    currentStep = 1,
    readinessScore = 0,
    createdAt,
  } = application;

  const location = businessProfile.location || 'Maharashtra';
  const industry = businessProfile.industryType || 'Industrial Unit';

  // Format date if available
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recently';

  // Determine progress percentage based on step and readiness
  let progressPercent = 25;
  if (status === 'draft') {
    if (currentStep === 1) progressPercent = 25;
    else if (currentStep === 2) progressPercent = 45;
    else if (currentStep === 3) progressPercent = Math.max(50, Math.min(85, readinessScore));
    else progressPercent = 90;
  } else if (status === 'ready_for_validation') {
    progressPercent = 90;
  } else if (status === 'submitted') {
    progressPercent = 100;
  } else if (status === 'under_review') {
    progressPercent = 70;
  } else if (status === 'at_risk') {
    progressPercent = 90;
  } else if (status === 'approved') {
    progressPercent = 100;
  }

  const isDraft = status === 'draft' || status === 'ready_for_validation';
  const actionText = isDraft ? 'Continue' : status === 'submitted' ? 'View' : 'Track';
  const actionUrl = isDraft
    ? `/entrepreneur/applications/${applicationId}`
    : `/entrepreneur/applications/${applicationId}`;

  return (
    <Card className="app-list-card">
      <div className="app-card-left">
        <div className="app-unit-icon">
          <Factory size={22} />
        </div>
        <div className="app-card-details">
          <h3>{unitName || `${industry} Unit`}</h3>
          <p>
            <MapPin size={12} />
            <span>{location}</span>
            <span className="dot-sep">·</span>
            <span>{isDraft ? `Draft created ${dateStr}` : `Submitted ${dateStr}`}</span>
          </p>
          <small className="app-sub-id">{applicationId} · {industry}</small>
        </div>
      </div>

      <div className="app-card-right">
        <div className="app-status-box">
          <ApplicationStatusBadge status={status} />
        </div>

        <div className="app-progress-box">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="progress-label">{progressPercent}%</span>
        </div>

        <div className="app-action-box">
          <Button asChild variant={isDraft ? 'default' : 'outline'} size="default">
            <Link to={actionUrl}>
              {actionText} <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
