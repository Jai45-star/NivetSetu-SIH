import { listOfficerApplications } from './workflowService.js';
const types = ['QUERY_RAISED', 'QUERY_RESPONDED', 'SLA_WARNING', 'SLA_BREACHED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED'];
export async function notifications(role, userId) {
  const apps = await listOfficerApplications();
  return apps.filter(a => role === 'officer' || a.userId === userId).flatMap(a => a.workflowEvents.filter(e => types.includes(e.type) && (role === 'officer' ? e.type !== 'QUERY_RAISED' : e.type !== 'QUERY_RESPONDED')).map(e => ({ id: e.eventId, type: e.type, message: e.message, at: e.at, applicationId: a.applicationId, unitName: a.unitName }))).sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
}
