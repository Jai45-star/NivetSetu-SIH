import express from 'express';
import { healthRoutes } from './routes/healthRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use('/api', healthRoutes);
app.use(notFound);
app.use(errorHandler);
