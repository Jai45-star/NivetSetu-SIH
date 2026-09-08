import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeText } from '../utils/textNormalizer.js';
let active = 0;
export async function extractDocument(doc, { timeoutMs = 20000 } = {}) {
  if (active >= 2) return { status: 'unavailable', textAvailable: false, confidence: 'low' };
  active++;
  try {
    const result = await new Promise(resolve => {
      const child = fork(fileURLToPath(new URL('./extractionWorker.js', import.meta.url)), [], {
        execArgv: ['--max-old-space-size=256'], stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true,
      });
      let finished = false;
      const done = value => { if (finished) return; finished = true; clearTimeout(timer); child.kill(); resolve(value); };
      const timer = setTimeout(() => done({ success: false }), timeoutMs);
      child.once('message', done);
      child.once('error', () => done({ success: false }));
      child.once('exit', () => done({ success: false }));
      child.send({ storedName: doc.storedName, mimeType: doc.mimeType });
    });
    const text = normalizeText(result.text || '');
    if (!result.success || text.replace(/[^a-zA-Z]/g, '').length < 30 || result.confidence === 'low') return { status: 'unreadable', textAvailable: false, confidence: 'low', method: result.method || 'unavailable' };
    return { status: 'extracted', textAvailable: true, confidence: result.confidence, method: result.method, text };
  } finally { active--; }
}
