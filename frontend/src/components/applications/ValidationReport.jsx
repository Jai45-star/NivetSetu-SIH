import { CheckCircle2, AlertTriangle, ScanSearch, CircleX, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
const groups = [ { severity: 'error', title: 'Blocking Issues', icon: CircleX }, { severity: 'warning', title: 'Warnings', icon: AlertTriangle }, { severity: 'manual_review', title: 'Manual Review', icon: ScanSearch } ];
export function ValidationReport({ report, onFix, readOnly = false }) {
  if (!report) return null;
  return <section className="validation-report" aria-labelledby="validation-report-title">
    <div className="section-heading"><div><span className="eyebrow">PRE-SUBMISSION ASSISTANCE</span><h2 id="validation-report-title">NiveshSetu Pre-Validation Report</h2></div></div>
    <p className="report-helper">{report.disclaimer}</p>
    <Card className="report-summary"><h3>Application Summary</h3><p>{report.unitName} · {report.applicationId}</p><small>Checked {new Date(report.validatedAt).toLocaleString('en-IN')}</small><div className="report-component-grid">{Object.entries(report.readiness.components).map(([key, part]) => <div key={key}><span>{key === 'documentValidation' ? 'Document Validation' : key === 'consistency' ? 'Consistency Checks' : 'Completeness'}</span><strong>{Math.round(part.earned)} / {part.maximum}</strong><small>{part.passed} of {part.total} checks passed</small></div>)}</div></Card>
    <div id="validation-issues" tabIndex={-1} className="validation-issues">
      {report.readiness.ready && <div className="validation-passed" role="status"><CheckCircle2 size={24}/><div><h3>Pre-validation Passed</h3><p>Your application has passed NiveshSetu's pre-submission checks.</p><small>Final scrutiny and approval remain with the authorized government department.</small></div></div>}
      {groups.map(({ severity, title, icon: Icon }) => {
        const issues = report.issues.filter(i => i.severity === severity);
        return issues.length ? <section className={`issue-group issue-${severity}`} key={severity}><h3><Icon size={18}/>{title} <span>{issues.length}</span></h3>{issues.map((item, index) => <Card key={`${item.code}-${item.documentId}-${index}`} className="validation-issue"><div><small>{item.documentName}</small><h4>{item.title}</h4><p>{item.message}</p>{item.detectedValue && item.expected && <dl className="detected-values"><div><dt>Detected</dt><dd>{item.detectedValue}</dd></div><div><dt>{item.referenceDocument || 'Expected'}</dt><dd>{item.expected}</dd></div></dl>}<p className="issue-action"><strong>How to fix:</strong> {item.action}</p></div>{!readOnly && <Button variant="outline" onClick={() => onFix(item.documentId)}>{item.documentId ? 'Fix document' : 'Edit profile'}<ArrowUpRight size={14}/></Button>}</Card>)}</section> : null;
      })}
    </div>
    <Card className="consistency-report"><h3>Company-name consistency</h3><p>Compared with company identification; punctuation and common legal suffix abbreviations are normalized.</p>{report.consistency.comparisons.map(comparison => <div key={comparison.documentId}><span>{comparison.documentName}<small>{comparison.detectedValue || 'No reliable name extracted'}</small></span><strong>{comparison.status === 'match' ? 'Names consistent' : comparison.status === 'unavailable' ? 'Not yet checked' : 'Needs review'}</strong></div>)}</Card>
    <details className="rule-references"><summary>Checks, limits and rule references</summary><p>Checks performed: {report.summary.checksPerformed}. Document checks count one per required file; consistency checks count one per comparison; profile checks count one per required field.</p>{report.issues.filter(i => i.severity === 'info').map((item, index) => <p key={index}><strong>{item.documentName}:</strong> {item.message}</p>)}<ul>{report.ruleReferences.map(rule => <li key={rule.ruleId}>{rule.ruleId}: {rule.name}. {rule.scope}.</li>)}</ul><p>No document authenticity, signature, engineering, legal compliance or government acceptance determination is made.</p></details>
  </section>;
}
