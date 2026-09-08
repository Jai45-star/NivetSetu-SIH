export function normalizeText(text = '') {
  return text.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/[\t ]+/g, ' ').trim()).join('\n').trim();
}
export function normalizeCompanyName(name = '') {
  return name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\bpvt\b/g, 'private').replace(/\bltd\b/g, 'limited')
    .replace(/\blimited liability partnership\b/g, 'llp').replace(/\s+/g, ' ').trim();
}
export function compareCompanyNames(a, b) {
  const left = normalizeCompanyName(a), right = normalizeCompanyName(b);
  if (!left || !right) return 'unavailable';
  if (left === right) return 'match';
  // Near-matches are review candidates, never silently accepted as equivalent.
  const tokens = new Set(left.split(' '));
  const other = new Set(right.split(' '));
  const common = [...tokens].filter(t => other.has(t)).length;
  return common / new Set([...tokens, ...other]).size >= 0.75 ? 'possible_match' : 'mismatch';
}
