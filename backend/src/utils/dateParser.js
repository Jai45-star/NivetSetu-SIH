const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function parseDocumentDate(value) {
  if (!value) return { status: 'missing' };
  const text = value.trim();
  let year, month, day;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [, year, month, day] = match.map(Number);
  else {
    match = text.match(/^(\d{1,2})[ -]([a-zA-Z]+)[ ,\-]+(\d{4})$/);
    if (match) { day = Number(match[1]); month = months.indexOf(match[2].slice(0, 3).toLowerCase()) + 1; year = Number(match[3]); }
    else {
      match = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
      if (!match) return { status: 'uncertain' };
      day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
      if (day <= 12 && month <= 12 && day !== month) return { status: 'ambiguous' };
    }
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2200 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return { status: 'invalid' };
  return { status: 'parsed', value: date.toISOString().slice(0, 10) };
}
