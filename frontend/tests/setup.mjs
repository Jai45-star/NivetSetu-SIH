import { createServer } from 'vite';
import { app } from '../../backend/src/app.js';

// Own the actual servers directly; avoid shell process-tree teardown on Windows.
export default async function setup() {
  const api = app.listen(4011, '127.0.0.1');
  await new Promise((resolve, reject) => {
    api.once('listening', resolve);
    api.once('error', reject);
  });
  let frontend;
  try {
    frontend = await createServer({
      server: { host: '127.0.0.1', port: 5174, strictPort: true,
        proxy: { '/api': { target: 'http://127.0.0.1:4011', changeOrigin: true } } },
    });
    await frontend.listen();
  } catch (error) {
    await frontend?.close();
    api.closeAllConnections();
    await new Promise(resolve => api.close(resolve));
    throw error;
  }
  return async () => {
    await frontend.close();
    api.closeAllConnections();
    await new Promise(resolve => api.close(resolve));
  };
}
