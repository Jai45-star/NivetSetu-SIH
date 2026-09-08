import express from 'express';
import { healthRoutes } from './routes/healthRoutes.js';
import { applicationRoutes } from './routes/applicationRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export const app = express();
app.disable('x-powered-by');

// Simple CORS middleware to support local frontend dev requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use('/api', healthRoutes);
app.use('/api/applications', applicationRoutes);
app.use(notFound);
app.use(errorHandler);
