import { Router } from 'express';
import { demoRole } from '../middleware/demoRole.js';
import { downloadDocumentFile } from '../controllers/applicationController.js';
import { getTracking, listOfficerApplications, officerAction, analytics } from '../services/workflowService.js';
import { notifications } from '../services/notificationService.js';
export const officerRoutes = Router();
officerRoutes.use(demoRole('officer'));
const json = action => async (req, res, next) => { try { res.json({ success: true, data: await action(req) }); } catch (e) { next(e); } };
officerRoutes.get('/notifications', json(req => notifications('officer', req.demoActor.id)));
officerRoutes.get('/applications', json(() => listOfficerApplications()));
officerRoutes.get('/sla', json(async () => {
  const all = await listOfficerApplications();
  // SLA monitoring only shows active applications (not final decisions) with SLA data
  return all.filter(a => !['approved', 'rejected'].includes(a.status));
}));
officerRoutes.get('/analytics', json(async () => analytics(await listOfficerApplications())));
officerRoutes.get('/applications/:id', json(req => getTracking(req.params.id, true)));
officerRoutes.get('/applications/:id/documents/:documentId/file', downloadDocumentFile);
for (const action of ['start-review', 'advance-stage', 'query', 'approve', 'reject', 'note']) officerRoutes.post(`/applications/:id/${action}`, json(req => officerAction(req.params.id, action, req.body)));

