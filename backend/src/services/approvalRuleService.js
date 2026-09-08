import { DEMO_REGULATORY_RULES, STANDARD_DOCUMENTS } from '../rules/regulatoryRules.js';

export class ApprovalRuleService {
  /**
   * Evaluates a business profile and returns the list of required approvals and normalized documents.
   */
  static generateApprovalsForProfile(profile = {}) {
    const industry = profile.industryType || 'Food Processing';
    const rulesForIndustry = DEMO_REGULATORY_RULES[industry] || DEMO_REGULATORY_RULES['Electronics / Engineering'];

    // Map rules to approval items with explainable reasons
    const approvals = rulesForIndustry.map(rule => {
      const docs = rule.documentIds.map(docId => STANDARD_DOCUMENTS[docId]?.name || docId);
      return {
        id: rule.id,
        name: rule.name,
        department: rule.department,
        ruleId: rule.ruleId,
        status: rule.status || 'Required',
        estimatedSla: rule.estimatedSla,
        reason: rule.reason,
        documentCount: rule.documentIds.length,
        documentNames: docs,
        matchedProfile: {
          industry: profile.industryType || 'Unspecified',
          employees: profile.employeeRange || 'All ranges',
          stage: profile.businessStage || 'All stages',
          investment: profile.investmentRange || 'All ranges',
        },
      };
    });

    // Build normalized document requirement list and compute reuse
    const docUsageMap = new Map();

    for (const rule of rulesForIndustry) {
      for (const docId of rule.documentIds) {
        if (!docUsageMap.has(docId)) {
          docUsageMap.set(docId, []);
        }
        docUsageMap.get(docId).push(rule.name);
      }
    }

    const requiredDocuments = [];
    for (const [docId, approvalNames] of docUsageMap.entries()) {
      const docDef = STANDARD_DOCUMENTS[docId] || {
        id: docId,
        name: docId,
        category: 'General',
        description: 'Required supporting documentation',
        acceptedFormats: ['PDF'],
      };

      requiredDocuments.push({
        documentId: docDef.id,
        documentType: docDef.id,
        name: docDef.name,
        category: docDef.category,
        description: docDef.description,
        acceptedFormats: docDef.acceptedFormats,
        usedInApprovals: approvalNames,
        status: 'missing', // Phase 2: only 'missing' or 'uploaded'
        uploadedAt: null,
      });
    }

    return {
      approvals,
      requiredDocuments,
    };
  }
}
