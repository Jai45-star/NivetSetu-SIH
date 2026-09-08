import { GovernmentIntegrationAdapter } from './governmentIntegrationAdapter.js';
import { DEPARTMENT } from '../rules/slaPolicies.js';
class MockGovernmentAdapter extends GovernmentIntegrationAdapter {
  mode = 'mock';
  label = 'Prototype / Mock Government Workflow';
  submitApplication(application) { return { mode: this.mode, label: this.label, reference: `MOCK-${application.applicationId}`, liveConnection: false }; }
  getApplicationStatus(application) { return { status: application.status, mode: this.mode, liveConnection: false }; }
  pushStatusUpdate(application) { return this.getApplicationStatus(application); }
  getDepartmentInfo() { return { name: DEPARTMENT, mode: this.mode, liveConnection: false }; }
}
export const governmentAdapter = new MockGovernmentAdapter();
export function assertIntegrationMode() {
  if (process.env.GOVERNMENT_INTEGRATION_MODE && process.env.GOVERNMENT_INTEGRATION_MODE !== 'mock') throw new Error('Only mock government integration is implemented.');
}
