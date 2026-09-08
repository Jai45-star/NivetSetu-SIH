import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { demoPdf, fixtureLines } from '../fixtures/demoPdf.js';
if (process.env.NODE_ENV === 'production') throw new Error('Demo fixtures are development-only.');
const directory = new URL('../fixtures/documents/', import.meta.url);
await fs.mkdir(directory, { recursive: true });
for (const type of ['pan_incorporation', 'factory_layout', 'ownership_lease', 'fire_safety_layout', 'site_plan', 'pollution_declaration']) {
  await fs.writeFile(new URL(`${type}.pdf`, directory), demoPdf(fixtureLines(type)));
}
for (const [name, type, variant] of [['expired_lease', 'ownership_lease', 'expired'], ['mismatch_environment', 'pollution_declaration', 'mismatch'], ['incorporation', 'pan_incorporation', 'incorporation']]) {
  await fs.writeFile(new URL(`${name}.pdf`, directory), demoPdf(fixtureLines(type, variant)));
}
console.log(`Generated 9 demo PDFs in ${fileURLToPath(directory)}`);
