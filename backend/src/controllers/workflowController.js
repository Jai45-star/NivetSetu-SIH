import { getTracking, replaceQueryDocument, respondToQuery } from '../services/workflowService.js';
import { StorageService } from '../services/storageService.js';
import { httpError } from '../utils/validationHelpers.js';
export async function tracking(req, res, next) { try { res.json({ success: true, data: await getTracking(req.params.id) }); } catch(e) { next(e); } }
export async function respond(req, res, next) { try { res.json({ success: true, data: await respondToQuery(req.params.id, req.body) }); } catch(e) { next(e); } }
export async function queryUpload(req, res, next) {
  try {
    if (!req.file) throw httpError(400, 'File is required.');
    try { StorageService.validateFile(req.file); } catch(e) { throw httpError(400, e.message); }
    const f = req.file;
    const data = await replaceQueryDocument(req.params.id, req.body.queryId, req.body.documentId, { originalName: f.originalname, storedName: f.filename, mimeType: f.mimetype, size: f.size });
    res.json({ success: true, data });
  } catch(e) { if (req.file) StorageService.deleteFile(req.file.filename); next(e); }
}
