export const DAY = 86400000;
export const SLA_THRESHOLDS = { attention: 60, atRisk: 80 };
export const STAGES = [
  { stageId: 'submitted', name: 'Submitted', slaDays: 1 },
  { stageId: 'documents', name: 'Document Verification', slaDays: 3 },
  { stageId: 'technical', name: 'Technical Scrutiny', slaDays: 10 },
  { stageId: 'decision', name: 'Final Decision', slaDays: 3 },
];
export const DEPARTMENT = 'Demo Industry Department';
export const OFFICER = { id: 'demo-officer-001', name: 'R. Deshmukh', department: DEPARTMENT };
