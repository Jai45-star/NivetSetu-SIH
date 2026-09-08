export function calculateValidationReadiness(documents, consistency, issues) {
  const total = documents.length;
  const uploaded = documents.filter(d => d.storedName).length;
  const checked = documents.filter(d => ['valid', 'warning'].includes(d.validation?.status)).length;
  const components = {
    completeness: { earned: total ? 40 * uploaded / total : 0, maximum: 40, passed: uploaded, total },
    documentValidation: { earned: total ? 40 * checked / total : 0, maximum: 40, passed: checked, total },
    consistency: { earned: consistency.total ? 20 * consistency.matched / consistency.total : 0, maximum: 20, passed: consistency.matched, total: consistency.total },
  };
  const unresolved = issues.filter(i => i.severity !== 'info');
  const raw = Math.round(Object.values(components).reduce((sum, part) => sum + part.earned, 0));
  const score = unresolved.length || !total ? Math.min(99, raw) : raw;
  const ready = score === 100 && unresolved.length === 0 && total > 0;
  return { score, label: ready ? 'Ready to Submit' : score < 60 ? 'Not Ready' : score < 85 ? 'Needs Fixes' : 'Needs Review', ready, components };
}
