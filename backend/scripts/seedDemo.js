import fs from 'node:fs/promises';
import { demoPdf, fixtureLines, demoProfile } from '../fixtures/demoPdf.js';
if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is development-only.');
const base = process.env.DEMO_API_URL || 'http://127.0.0.1:4000/api/applications';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Demo seeding only targets a local API.');
const results = [];
for (const scenario of ['incomplete', 'expired', 'mismatch', 'combined']) {
  const created = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unitName: `Shree Foods - ${scenario} demo`, businessProfile: demoProfile }) });
  if (!created.ok) throw new Error('Could not create demo draft. Start the API first.');
  const { data } = await created.json();
  for (const doc of data.documents) {
    if (['incomplete', 'combined'].includes(scenario) && doc.documentId === 'fire_safety_layout') continue;
    let variant = 'valid';
    if (['expired', 'combined'].includes(scenario) && doc.documentId === 'ownership_lease') variant = 'expired';
    if (['mismatch', 'combined'].includes(scenario) && doc.documentId === 'pollution_declaration') variant = 'mismatch';
    const form = new FormData(); form.append('documentId', doc.documentId);
    form.append('file', new Blob([demoPdf(fixtureLines(doc.documentId, variant))], { type: 'application/pdf' }), `${doc.documentId}.pdf`);
    const uploaded = await fetch(`${base}/${data.applicationId}/documents`, { method: 'POST', body: form });
    if (!uploaded.ok) throw new Error(await uploaded.text());
  }
  const response = await fetch(`${base}/${data.applicationId}/validate`, { method: 'POST' });
  if (!response.ok) throw new Error(await response.text());
  const { data: validated } = await response.json();
  const step = await fetch(`${base}/${data.applicationId}/current-step`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 3 }) });
  if (!step.ok) throw new Error(await step.text());
  results.push({ scenario, applicationId: data.applicationId, readiness: validated.readinessScore, url: `/entrepreneur/applications/${data.applicationId}` });
}
await fs.writeFile(new URL('../fixtures/last-demo-run.json', import.meta.url), JSON.stringify(results, null, 2));
console.table(results);
console.log('Run seed:demo again for fresh scenarios; existing applications are not deleted.');
