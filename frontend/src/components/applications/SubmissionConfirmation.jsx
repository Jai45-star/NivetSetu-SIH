import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ValidationReport } from './ValidationReport';
export function SubmissionConfirmation({ application }) {
  return <div className="application-wizard"><Card className="submission-confirmation"><CheckCircle2 size={38}/><span className="eyebrow">NIVESHSETU PROTOTYPE</span><h1 id="page-title">Application submitted successfully</h1><p>Saved inside the NiveshSetu prototype. Nothing has been sent to a government portal.</p><dl><div><dt>Application ID</dt><dd>{application.applicationId}</dd></div><div><dt>Current stage</dt><dd>{application.currentStage || 'Submitted'}</dd></div><div><dt>Submitted at</dt><dd>{new Date(application.submittedAt).toLocaleString('en-IN')}</dd></div></dl><Button asChild variant="outline"><Link to="/entrepreneur/applications">Back to My Applications</Link></Button></Card><ValidationReport report={application.validationReport} readOnly/></div>;
}
