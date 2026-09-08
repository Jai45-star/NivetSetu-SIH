import { DAY, SLA_THRESHOLDS } from '../rules/slaPolicies.js';
export function calculateSLA(stage, now = new Date()) {
  if (!stage?.startedAt) return null;
  const end = new Date(stage.completedAt || stage.slaPausedAt || now).getTime();
  const elapsedMs = Math.max(0, end - new Date(stage.startedAt).getTime() - (stage.slaPausedDuration || 0));
  const elapsedDays = elapsedMs / DAY;
  const remainingDays = stage.slaDays - elapsedDays;
  const percentageElapsed = elapsedDays / stage.slaDays * 100;
  const slaStatus = remainingDays < 0 ? 'BREACHED' : percentageElapsed >= SLA_THRESHOLDS.atRisk ? 'AT_RISK' : percentageElapsed >= SLA_THRESHOLDS.attention ? 'ATTENTION' : 'SAFE';
  const ongoingPause = stage.slaPausedAt && !stage.completedAt ? Math.max(0, new Date(now) - new Date(stage.slaPausedAt)) : 0;
  return { elapsedDays, slaDays: stage.slaDays, remainingDays, percentageElapsed, slaStatus, paused: !!stage.slaPausedAt,
    dueAt: new Date(new Date(stage.startedAt).getTime() + stage.slaDays * DAY + (stage.slaPausedDuration || 0) + ongoingPause).toISOString() };
}
export function bottleneck(application, sla, now = new Date()) {
  if (application.workflow.applicantActionRequired) return { bottleneckStatus: 'Waiting for Applicant', bottleneckReason: `Officer query pending for ${Math.floor((new Date(now) - new Date(application.queries.at(-1).createdAt)) / DAY)} days. Department SLA is paused.` };
  if (['approved', 'rejected'].includes(application.status)) return { bottleneckStatus: 'Completed', bottleneckReason: 'Prototype decision recorded.' };
  if (sla?.slaStatus === 'BREACHED') return { bottleneckStatus: 'Deadline Breached', bottleneckReason: `${application.currentStage} exceeded its demo SLA by ${(-sla.remainingDays).toFixed(1)} days.` };
  if (sla?.percentageElapsed >= 80) return { bottleneckStatus: 'High Attention', bottleneckReason: `${application.currentStage} has consumed ${Math.floor(sla.percentageElapsed)}% of its demo SLA.` };
  if (application.queryCount >= 2) return { bottleneckStatus: 'Repeated Queries', bottleneckReason: `${application.queryCount} query cycles recorded. Review clarification history.` };
  return { bottleneckStatus: sla?.slaStatus === 'ATTENTION' ? 'Needs Attention' : 'On Track', bottleneckReason: sla?.slaStatus === 'ATTENTION' ? '40% or less of the demo stage SLA remains.' : 'Within the configured demo stage SLA.' };
}
