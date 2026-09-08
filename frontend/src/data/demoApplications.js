export const entrepreneurApplications = [
 { id: 'NS-DEMO-001', name: 'Food Processing Unit', location: 'Nagpur, Maharashtra', department: 'Food & Drug Administration', status: 'Draft', tone: 'warning' },
 { id: 'NS-DEMO-002', name: 'Textile Manufacturing Unit', location: 'Pune, Maharashtra', department: 'Industries Department', status: 'Under Review', tone: 'primary' },
 { id: 'NS-DEMO-003', name: 'Chemical Unit', location: 'Thane, Maharashtra', department: 'Maharashtra Pollution Control Board', status: 'At Risk', tone: 'danger' },
];
export const officerApplications = [
 { id: 'NS-DEMO-004', name: 'Shree Foods Ltd.', industry: 'Food Processing', district: 'Nagpur', status: 'Under Review', tone: 'primary' },
 { id: 'NS-DEMO-005', name: 'Unity Textiles', industry: 'Textile', district: 'Pune', status: 'Need Attention', tone: 'warning' },
 { id: 'NS-DEMO-006', name: 'GreenChem Pvt. Ltd.', industry: 'Chemical', district: 'Thane', status: 'SLA Breached', tone: 'danger' },
];
export const dashboardMetrics = {
 entrepreneur: [{ value: 3, label: 'Total Applications', tone: 'primary', icon: 'files' }, { value: 1, label: 'Draft', tone: 'warning', icon: 'draft' }, { value: 1, label: 'Under Review', tone: 'primary', icon: 'clock' }, { value: 1, label: 'At Risk', tone: 'danger', icon: 'alert' }],
 officer: [{ value: 24, label: 'Total Applications', tone: 'primary', icon: 'files' }, { value: 8, label: 'Under Review', tone: 'primary', icon: 'clock' }, { value: 5, label: 'Need Attention', tone: 'warning', icon: 'alert' }, { value: 2, label: 'SLA Breached', tone: 'danger', icon: 'alert' }],
};
