import { ApplicationService } from '../services/applicationService.js';
import { StorageService } from '../services/storageService.js';
import path from 'node:path';

export async function listApplications(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || 'demo-entrepreneur-001';
    const status = req.query.status || null;
    const applications = await ApplicationService.listApplications(userId, status);
    res.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplication(req, res, next) {
  try {
    const { id } = req.params;
    const application = await ApplicationService.getApplicationById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: `Application '${id}' not found`,
      });
    }
    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || 'demo-entrepreneur-001';
    const newDraft = await ApplicationService.createDraft(userId, req.body || {});
    res.status(201).json({
      success: true,
      message: 'Draft application created successfully',
      data: newDraft,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessProfile(req, res, next) {
  try {
    const { id } = req.params;
    const profile = req.body || {};

    if (!profile.industryType || !profile.location) {
      return res.status(400).json({
        success: false,
        message: 'Industry Type and Location are required',
      });
    }

    const updated = await ApplicationService.updateBusinessProfile(id, profile);
    res.json({
      success: true,
      message: 'Business profile and regulatory checklist updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateApprovals(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await ApplicationService.generateApprovals(id);
    res.json({
      success: true,
      message: 'Approvals regenerated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const documentId = req.body.documentId;
    const file = req.file;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId field is required in form-data',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    const fileData = {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };

    const updated = await ApplicationService.attachDocument(id, documentId, fileData);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeDocument(req, res, next) {
  try {
    const { id, documentId } = req.params;
    const updated = await ApplicationService.removeDocument(id, documentId);
    res.json({
      success: true,
      message: 'Document removed successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentMetadata(req, res, next) {
  try {
    const { id, documentId } = req.params;
    const application = await ApplicationService.getApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const doc = (application.documents || []).find(d => d.documentId === documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document requirement not found' });
    }

    res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDocumentFile(req, res, next) {
  try {
    const { id, documentId } = req.params;
    const application = await ApplicationService.getApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const doc = (application.documents || []).find(d => d.documentId === documentId);
    if (!doc || !doc.storedName) {
      return res.status(404).json({ success: false, message: 'No file uploaded for this document' });
    }

    const filePath = StorageService.getFilePath(doc.storedName);
    if (!StorageService.fileExists(doc.storedName)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.sendFile(filePath, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${doc.originalName || path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentStep(req, res, next) {
  try {
    const { id } = req.params;
    const { step } = req.body;
    const updated = await ApplicationService.updateCurrentStep(id, step);
    res.json({
      success: true,
      message: 'Step updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
