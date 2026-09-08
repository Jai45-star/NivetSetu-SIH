import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

// Connect to MongoDB or fall back gracefully
await connectDB();

const server = app.listen(config.port, () => {
  console.log(`NiveshSetu API running on http://127.0.0.1:${config.port}`);
});

server.on('error', (error) => {
  console.error('[NiveshSetu Error]', error.message);
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`\n[NiveshSetu] Graceful shutdown initiated (${signal})...`);
    server.close(async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      process.exit(0);
    });
  });
}
