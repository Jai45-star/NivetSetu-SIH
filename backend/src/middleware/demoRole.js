import { ApplicationService } from '../services/applicationService.js';
import { httpError } from '../utils/validationHelpers.js';
// Explicitly demo-only identities, replace with authenticated claims in production.
export function demoRole(role) {
  return (req, res, next) => {
    const actual = req.headers['x-demo-role'] || 'entrepreneur';
    if (actual !== role) return next(httpError(403, `This action requires the ${role} demo role.`));
    req.demoActor = { role: actual, id: role === 'officer' ? 'demo-officer-001' : String(req.headers['x-user-id'] || 'demo-entrepreneur-001') };
    next();
  };
}
export async function requireOwner(req, res, next) {
  try {
    const application = await ApplicationService.requireApplication(req.params.id);
    if (application.userId !== req.demoActor.id) throw httpError(403, 'This application belongs to another demo applicant.');
    next();
  } catch (error) { next(error); }
}
