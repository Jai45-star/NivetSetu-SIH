import { connectDB } from '../src/config/db.js';
import { app } from '../src/app.js';
import { seedWorkflow } from '../src/services/workflowSeedService.js';
if (process.env.NODE_ENV === 'production') throw new Error('Workflow seeding is development-only.');
await connectDB();
console.table(await seedWorkflow());
const port = process.env.PORT || 4013;
app.listen(port, '127.0.0.1', () => console.log(`Seeded workflow demo API: http://127.0.0.1:${port}. Keep this process running for memory mode.`));
