import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, AlertCircle, Files } from 'lucide-react';
import { ApplicationApi } from '../../services/applicationApi';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'at_risk', label: 'At Risk' },
];

export function EntrepreneurApplications() {
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await ApplicationApi.getApplications(activeFilter === 'all' ? null : activeFilter);
        if (isMounted) setApplications(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch applications');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeFilter]);

  return (
    <div className="applications-page">
      <PageHeader
        eyebrow="My Applications"
        title="Industrial Approval Pipeline"
        description="Monitor draft progress, tracked submissions, and statutory status."
        action={
          <Button asChild>
            <Link to="/entrepreneur/applications/new">
              <Plus size={16} /> Start New Application
            </Link>
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="filter-bar">
        <div className="filter-tabs-scroll">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`filter-tab-btn ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List Content */}
      <div className="applications-list-container">
        {loading ? (
          <div className="apps-loading-state">
            <div className="loading-spinner" />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <Card className="empty-state-box">
            <AlertCircle size={32} className="text-danger" />
            <h3>Unable to fetch applications</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => setActiveFilter('all')}>
              Try Again
            </Button>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="empty-state-box">
            <Files size={36} className="text-muted" />
            <h3>No applications found</h3>
            <p>
              {activeFilter === 'all'
                ? "You haven't started any industrial applications yet."
                : `No applications currently matching status "${activeFilter}".`}
            </p>
            <Button asChild variant="default">
              <Link to="/entrepreneur/applications/new">
                <Plus size={16} /> Start Your First Application
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="app-card-grid">
            {applications.map(app => (
              <ApplicationCard key={app.applicationId} application={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
