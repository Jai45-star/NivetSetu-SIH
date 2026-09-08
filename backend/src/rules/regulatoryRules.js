/**
 * Demo Regulatory Ruleset for NiveshSetu (Phase 2 Prototype)
 * Notice: Prototype checklist generated from demo regulatory rules for SIH demonstration.
 * Not an official statutory enactment.
 */

export const STANDARD_DOCUMENTS = {
  pan_incorporation: {
    id: 'pan_incorporation',
    name: 'PAN / Company Incorporation Certificate',
    category: 'Identity & Entity Proof',
    description: 'Valid PAN card of applicant entity or Certificate of Incorporation from MCA.',
    acceptedFormats: ['PDF', 'PNG', 'JPG', 'JPEG'],
  },
  ownership_lease: {
    id: 'ownership_lease',
    name: 'Lease Agreement / Land Ownership Proof',
    category: 'Premises Proof',
    description: 'Registered lease deed or 7/12 extract / MIDC land allotment letter.',
    acceptedFormats: ['PDF'],
  },
  factory_layout: {
    id: 'factory_layout',
    name: 'Factory Layout Plan',
    category: 'Engineering & Layout',
    description: 'Detailed machinery layout plan signed by certified structural engineer/architect.',
    acceptedFormats: ['PDF'],
  },
  fire_safety_layout: {
    id: 'fire_safety_layout',
    name: 'Fire Safety & Evacuation Layout',
    category: 'Safety & Compliance',
    description: 'Building fire hydrant layout, emergency exits and firefighting apparatus schematic.',
    acceptedFormats: ['PDF'],
  },
  pollution_declaration: {
    id: 'pollution_declaration',
    name: 'Environmental / Pollution Process Declaration',
    category: 'Environmental Compliance',
    description: 'Process flow diagram with effluent generation, air emission and solid waste mitigation details.',
    acceptedFormats: ['PDF'],
  },
  site_plan: {
    id: 'site_plan',
    name: 'Site Plan / Building Blueprint',
    category: 'Premises Proof',
    description: 'Sanctioned site boundary plan and key plan showing surrounding installations.',
    acceptedFormats: ['PDF'],
  },
  employee_declaration: {
    id: 'employee_declaration',
    name: 'Employee Register & Safety Declaration',
    category: 'Labour & Workforce',
    description: 'Staff categorization schedule and worker welfare policy compliance undertaking.',
    acceptedFormats: ['PDF'],
  },
  hazard_msds: {
    id: 'hazard_msds',
    name: 'Material Safety Data Sheet (MSDS) & Disaster Plan',
    category: 'Hazardous Materials & Safety',
    description: 'On-site emergency plan and chemical storage inventory with hazardous classification.',
    acceptedFormats: ['PDF'],
  },
};

export const DEMO_REGULATORY_RULES = {
  'Food Processing': [
    {
      id: 'appr_fp_factory_licence',
      name: 'Factory Licence',
      department: 'Directorate of Industrial Safety & Health (DISH)',
      ruleId: 'Demo Rule FP-01',
      status: 'Required',
      estimatedSla: '15 working days',
      reason: 'Mandatory under Maharashtra Factories Rules for manufacturing premises employing industrial workers.',
      criteria: {
        industryType: 'Food Processing',
        minEmployees: 10,
      },
      documentIds: ['pan_incorporation', 'factory_layout', 'ownership_lease'],
    },
    {
      id: 'appr_fp_fire_noc',
      name: 'Fire NOC (Provisional)',
      department: 'Maharashtra Fire Services',
      ruleId: 'Demo Rule FP-02',
      status: 'Required',
      estimatedSla: '10 working days',
      reason: 'Required because the selected food manufacturing unit operates processing equipment within an enclosed industrial premises.',
      criteria: {
        industryType: 'Food Processing',
      },
      documentIds: ['fire_safety_layout', 'site_plan', 'ownership_lease'],
    },
    {
      id: 'appr_fp_mpcb_consent',
      name: 'Pollution Consent to Establish (CTE)',
      department: 'Maharashtra Pollution Control Board (MPCB)',
      ruleId: 'Demo Rule FP-03',
      status: 'Required',
      estimatedSla: '21 working days',
      reason: 'Mandatory under Water & Air Acts for processing units with trade effluent and organic wash wastewater.',
      criteria: {
        industryType: 'Food Processing',
      },
      documentIds: ['site_plan', 'pollution_declaration'],
    },
    {
      id: 'appr_fp_building_plan',
      name: 'Industrial Building / Plan Sanction',
      department: 'Town Planning Department / MIDC',
      ruleId: 'Demo Rule FP-04',
      status: 'Required',
      estimatedSla: '30 working days',
      reason: 'Required for new industrial unit construction or alterations to approved manufacturing floor plans.',
      criteria: {
        industryType: 'Food Processing',
        stages: ['New Unit', 'Expansion'],
      },
      documentIds: ['site_plan', 'ownership_lease'],
    },
  ],

  'Textile Manufacturing': [
    {
      id: 'appr_tm_factory_licence',
      name: 'Factory Licence',
      department: 'Directorate of Industrial Safety & Health (DISH)',
      ruleId: 'Demo Rule TM-01',
      status: 'Required',
      estimatedSla: '15 working days',
      reason: 'Mandatory under the Factories Act for textile weaving, dyeing, and spinning manufacturing units.',
      criteria: {
        industryType: 'Textile Manufacturing',
      },
      documentIds: ['pan_incorporation', 'factory_layout', 'ownership_lease'],
    },
    {
      id: 'appr_tm_fire_noc',
      name: 'Fire NOC (Provisional)',
      department: 'Maharashtra Fire Services',
      ruleId: 'Demo Rule TM-02',
      status: 'Required',
      estimatedSla: '10 working days',
      reason: 'High combustible load (textile raw fibers and finished fabric storage) requires fire suppression clearance.',
      criteria: {
        industryType: 'Textile Manufacturing',
      },
      documentIds: ['fire_safety_layout', 'site_plan', 'ownership_lease'],
    },
    {
      id: 'appr_tm_mpcb_consent',
      name: 'Pollution Consent to Establish (CTE)',
      department: 'Maharashtra Pollution Control Board (MPCB)',
      ruleId: 'Demo Rule TM-03',
      status: 'Required',
      estimatedSla: '21 working days',
      reason: 'Required for wet textile processing, bleaching, sizing, and washing discharge compliance.',
      criteria: {
        industryType: 'Textile Manufacturing',
      },
      documentIds: ['site_plan', 'pollution_declaration'],
    },
    {
      id: 'appr_tm_labour_reg',
      name: 'Labour Welfare & Contract Registration',
      department: 'Labour Department, Maharashtra',
      ruleId: 'Demo Rule TM-04',
      status: 'Required',
      estimatedSla: '7 working days',
      reason: 'Applicable for industrial units employing contractual or permanent shopfloor workers.',
      criteria: {
        industryType: 'Textile Manufacturing',
      },
      documentIds: ['pan_incorporation', 'employee_declaration'],
    },
  ],

  'Chemical Manufacturing': [
    {
      id: 'appr_cm_factory_licence',
      name: 'Factory Licence (Major Accident Hazard Category)',
      department: 'Directorate of Industrial Safety & Health (DISH)',
      ruleId: 'Demo Rule CM-01',
      status: 'Required',
      estimatedSla: '20 working days',
      reason: 'Special industrial licence mandatory for chemical formulation and raw compound handling facilities.',
      criteria: {
        industryType: 'Chemical Manufacturing',
      },
      documentIds: ['pan_incorporation', 'factory_layout', 'ownership_lease'],
    },
    {
      id: 'appr_cm_fire_noc',
      name: 'Special Fire & Explosion Safety NOC',
      department: 'Maharashtra Fire Services',
      ruleId: 'Demo Rule CM-02',
      status: 'Required',
      estimatedSla: '12 working days',
      reason: 'Classified volatile organic compounds and solvent processing require comprehensive fire and foam system review.',
      criteria: {
        industryType: 'Chemical Manufacturing',
      },
      documentIds: ['fire_safety_layout', 'site_plan', 'ownership_lease'],
    },
    {
      id: 'appr_cm_mpcb_red',
      name: 'MPCB Red Category Consent to Establish',
      department: 'Maharashtra Pollution Control Board (MPCB)',
      ruleId: 'Demo Rule CM-03',
      status: 'Required',
      estimatedSla: '30 working days',
      reason: 'Chemical manufacturing is categorized under Red Category due to hazardous effluents and gaseous emissions.',
      criteria: {
        industryType: 'Chemical Manufacturing',
      },
      documentIds: ['site_plan', 'pollution_declaration', 'hazard_msds'],
    },
    {
      id: 'appr_cm_hazardous_clearance',
      name: 'Hazardous Chemical Storage Clearance',
      department: 'Directorate of Industrial Safety & Health (DISH)',
      ruleId: 'Demo Rule CM-04',
      status: 'Required',
      estimatedSla: '25 working days',
      reason: 'Mandatory under Manufacture, Storage and Import of Hazardous Chemicals Rules, 1989.',
      criteria: {
        industryType: 'Chemical Manufacturing',
      },
      documentIds: ['hazard_msds', 'site_plan'],
    },
  ],

  'Electronics / Engineering': [
    {
      id: 'appr_eng_factory_licence',
      name: 'Factory Licence',
      department: 'Directorate of Industrial Safety & Health (DISH)',
      ruleId: 'Demo Rule ENG-01',
      status: 'Required',
      estimatedSla: '15 working days',
      reason: 'Standard manufacturing licence for mechanical assembly, electronics soldering, and component fabrication.',
      criteria: {
        industryType: 'Electronics / Engineering',
      },
      documentIds: ['pan_incorporation', 'factory_layout', 'ownership_lease'],
    },
    {
      id: 'appr_eng_fire_noc',
      name: 'Fire NOC (Provisional)',
      department: 'Maharashtra Fire Services',
      ruleId: 'Demo Rule ENG-02',
      status: 'Required',
      estimatedSla: '10 working days',
      reason: 'Industrial fire prevention clearance for assembly floors and battery/electrical storage zones.',
      criteria: {
        industryType: 'Electronics / Engineering',
      },
      documentIds: ['fire_safety_layout', 'site_plan', 'ownership_lease'],
    },
    {
      id: 'appr_eng_mpcb_consent',
      name: 'Pollution Consent to Establish (Orange/Green Category)',
      department: 'Maharashtra Pollution Control Board (MPCB)',
      ruleId: 'Demo Rule ENG-03',
      status: 'Required',
      estimatedSla: '21 working days',
      reason: 'Clearance for electroplating, wash tanks, or electronic waste handling compliance.',
      criteria: {
        industryType: 'Electronics / Engineering',
      },
      documentIds: ['site_plan', 'pollution_declaration'],
    },
    {
      id: 'appr_eng_building_plan',
      name: 'Industrial Building / Shed Plan Sanction',
      department: 'Town Planning Department / MIDC',
      ruleId: 'Demo Rule ENG-04',
      status: 'Required',
      estimatedSla: '25 working days',
      reason: 'Required for industrial shed structural verification and floor space index approval.',
      criteria: {
        industryType: 'Electronics / Engineering',
      },
      documentIds: ['site_plan', 'ownership_lease'],
    },
  ],
};
