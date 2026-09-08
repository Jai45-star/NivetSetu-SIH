import { app } from './app.js';
import { config } from './config/env.js';
const server = app.listen(config.port, () => console.log(`NiveshSetu API listening on port ${config.port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
