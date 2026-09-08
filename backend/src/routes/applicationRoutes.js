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

export const applicationRoutes = Router();

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
