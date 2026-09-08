import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { MetricCard } from '../../components/shared/MetricCard';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ApplicationApi } from '../../services/applicationApi';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { entrepreneurApplications } from '../../data/demoApplications';

export function EntrepreneurDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await ApplicationApi.getApplications();
        if (isMounted) setApplications(data);
      } catch (err) {
        console.warn('Backend unavailable, using showcase fallback:', err.message);
        if (isMounted) {
          setFetchError(err.message);
          // Fallback to local demo applications
          setApplications(
            entrepreneurApplications.map(app => ({
              applicationId: app.id,
              unitName: app.name,
              businessProfile: { location: app.location, industryType: app.department },
              status: app.status.toLowerCase().replace(/\s+/g, '_'),
              currentStep: app.status === 'Draft' ? 1 : 4,
              readinessScore: app.status === 'Draft' ? 40 : 90,
              createdAt: new Date(),
            }))
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Compute live metrics
  const total = applications.length;
  const draftCount = applications.filter(a => a.status === 'draft' || a.status === 'ready_for_validation').length;
  const reviewCount = applications.filter(a => a.status === 'under_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const atRiskCount = applications.filter(a => a.status === 'at_risk').length;

  const metrics = [
    { value: total, label: 'Total Applications', tone: 'primary', icon: 'files' },
    { value: draftCount, label: 'Draft', tone: 'warning', icon: 'draft' },
    { value: reviewCount, label: 'Under Review', tone: 'primary', icon: 'clock' },
    { value: approvedCount, label: 'Approved', tone: 'success', icon: 'files' },
    { value: atRiskCount, label: 'At Risk', tone: 'danger', icon: 'alert' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Welcome back, Katyayani"
        title="Let's move your business forward!"
        description="Your industrial applications, with a little more clarity."
        action={
          <Button asChild size="default">
            <Link to="/entrepreneur/applications/new">
              <Plus size={16} /> Start New Application
            </Link>
          </Button>
        }
      />

      {/* 5 Dynamic Metric Cards */}
      <div className="metrics-grid metrics-grid-5">
        {metrics.map(metric => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {fetchError && (
        <div className="workspace-note" style={{ margin: '16px 0' }}>
          <AlertCircle size={16} className="text-warning" />
          <p>Using demo showcase fallback data. Live API notice: {fetchError}</p>
        </div>
      )}

      {/* My Applications Section */}
      <section className="applications-section">
        <div className="section-heading">
          <h2>
            My Applications <span className="count">{total}</span>
          </h2>
          <Link to="/entrepreneur/applications">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="apps-loading-state">
            <div className="loading-spinner" />
            <p>Loading your applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card className="empty-state-box">
            <p>No applications found.</p>
            <Button asChild variant="outline">
              <Link to="/entrepreneur/applications/new">Start an Application</Link>
            </Button>
          </Card>
        ) : (
          <div className="application-list">
            {applications.slice(0, 5).map(app => (
              <ApplicationCard key={app.applicationId} application={app} />
            ))}
          </div>
        )}
      </section>

      <div className="workspace-note">
        <Info size={19} />
        <p>
          <strong>A foundation for First-Time-Right applications.</strong> Prepare your checklist, review document issues and revalidate before prototype submission. Final decisions remain with the authorized department.
        </p>
      </div>

      <Card className="assistance-card">
        <div>
          <h2>A better start is a clearer start.</h2>
          <p>Explore the future home of regulatory guidance for your business.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/entrepreneur/assistant">
            Regulatory Assistant <ArrowRight size={15} />
          </Link>
        </Button>
      </Card>
    </>
  );
}
