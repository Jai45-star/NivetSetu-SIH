import { ApplicationService } from '../services/applicationService.js';
import { validateApplication } from '../services/applicationValidationService.js';
import { utcDay } from '../utils/validationHelpers.js';
export async function runValidation(req, res, next) {
  try {
    const data = await validateApplication(req.params.id, { force: req.body?.force === true, documentId: req.params.documentId });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}
export async function getValidation(req, res, next) {
  try {
    const app = await ApplicationService.requireApplication(req.params.id);
    res.json({ success: true, data: app.validationReport, stale: !!app.validationReport && app.validationReport.validationDay !== utcDay() });
  } catch (error) { next(error); }
}
export async function submitApplication(req, res, next) {
  try { res.json({ success: true, data: await ApplicationService.submitApplication(req.params.id), message: 'Application submitted to the NiveshSetu prototype only.' }); }
  catch (error) { next(error); }
}
