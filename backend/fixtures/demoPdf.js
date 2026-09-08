// Development/test-only, single-page PDF builder. No runtime PDF generation dependency.
export function demoPdf(lines) {
  const escape = value => value.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '-');
  const content = `BT /F1 12 Tf 50 790 Td 20 TL ${lines.map((line, index) => `${index ? 'T* ' : ''}(${escape(line)}) Tj`).join('\n')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
export const demoProfile = { industryType: 'Food Processing', location: 'Pune, Maharashtra', investmentRange: '₹1 – ₹5 Crore', employeeRange: '50 – 200', businessStage: 'New Unit', description: 'Demonstration food processing unit.' };
export function fixtureLines(type, variant = 'valid') {
  const company = variant === 'mismatch' ? 'Shree Agro Industries LLP' : type === 'pan_incorporation' ? 'Shree Foods Pvt. Ltd.' : 'SHREE FOODS PRIVATE LIMITED';
  const lines = ['NIVESHSETU - SIH DEMONSTRATION DOCUMENT', 'Not an official document. Not valid for any legal purpose.', '',
    `Document type: ${type}`, `Company Name: ${company}`, 'Address: Demo industrial premises, Pune, Maharashtra', 'Issue Date: 12 Aug 2024'];
  if (type === 'pan_incorporation') lines.push(variant === 'incorporation' ? 'Registration Number: DEMO-COMPANY-12345' : 'PAN: ABCDE1234F');
  if (type === 'ownership_lease') lines.push(`Expiry Date: ${variant === 'expired' ? '12 Aug 2024' : '12 Aug 2099'}`, 'Reference Number: DEMO-LEASE-001');
  if (type === 'pollution_declaration') lines.push('Reference Number: DEMO-ENV-001');
  if (type.includes('layout') || type === 'site_plan') lines.push('Illustrative layout text for file checks only.', 'No engineering or safety correctness is implied by this fixture.');
  return lines;
}
