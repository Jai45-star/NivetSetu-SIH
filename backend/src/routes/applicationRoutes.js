import { Router } from 'express';
import {
  listApplications,
  createApplication,
  getApplication,
  updateBusinessProfile,
  generateApprovals,
  uploadDocument,
  removeDocument,
  getDocumentMetadata,
  downloadDocumentFile,
  updateCurrentStep,
} from '../controllers/applicationController.js';
import { handleUpload } from '../middleware/uploadMiddleware.js';
import { runValidation, getValidation, submitApplication } from '../controllers/validationController.js';
import { demoRole, requireOwner } from '../middleware/demoRole.js';
import { tracking, respond, queryUpload } from '../controllers/workflowController.js';
import { notifications } from '../services/notificationService.js';

export const applicationRoutes = Router();
applicationRoutes.use(demoRole('entrepreneur'));
applicationRoutes.param('id', requireOwner);
applicationRoutes.use((req, res, next) => {
  const send = res.json.bind(res);
  res.json = payload => {
    const redact = a => { if (!a || typeof a !== 'object') return a; const result = { ...a }; delete result.internalNotes; if (result.workflowEvents) result.workflowEvents = result.workflowEvents.filter(e => !e.internal).map(e => { const copy = { ...e }; delete copy.previousStoredName; return copy; }); return result; };
    if (payload.data) payload.data = Array.isArray(payload.data) ? payload.data.map(redact) : redact(payload.data);
    return send(payload);
  };
  next();
});
applicationRoutes.get('/:id/tracking', tracking);
applicationRoutes.get('/notifications', async (req, res, next) => { try { res.json({ success: true, data: await notifications('entrepreneur', req.demoActor.id) }); } catch(e) { next(e); } });
applicationRoutes.post('/:id/query-response', respond);
applicationRoutes.post('/:id/query-documents', handleUpload, queryUpload);

applicationRoutes.get('/', listApplications);
applicationRoutes.post('/', createApplication);
applicationRoutes.get('/:id', getApplication);
applicationRoutes.patch('/:id/business-profile', updateBusinessProfile);
applicationRoutes.post('/:id/generate-approvals', generateApprovals);
applicationRoutes.post('/:id/documents', handleUpload, uploadDocument);
applicationRoutes.delete('/:id/documents/:documentId', removeDocument);
applicationRoutes.get('/:id/documents/:documentId', getDocumentMetadata);
applicationRoutes.get('/:id/documents/:documentId/file', downloadDocumentFile);
applicationRoutes.patch('/:id/current-step', updateCurrentStep);
applicationRoutes.post('/:id/validate', runValidation);
applicationRoutes.get('/:id/validation', getValidation);
applicationRoutes.post('/:id/documents/:documentId/validate', runValidation);
applicationRoutes.post('/:id/submit', submitApplication);
