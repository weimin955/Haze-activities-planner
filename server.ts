import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import psiHandler from './api/psi.js';
import healthHandler from './api/health.ts';
import mapgovHandler from './api/Mapgov.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser for JSON
  app.use(express.json());

  // Mount /api/psi route to the serverless function handler
  app.all('/api/psi', async (req, res) => {
    try {
      await psiHandler(req, res);
    } catch (err: any) {
      console.error('API Error in /api/psi:', err);
      if (!res.headersSent) {
        res.status(502).json({
          status: 'error',
          error: 'The National Environment Agency service refused the connection or encountered an error.',
          message: err?.message || 'Server handler failure',
        });
      }
    }
  });

  // Mount /api/health endpoint
  app.all('/api/health', async (req, res) => {
    try {
      await healthHandler(req, res);
    } catch (err: any) {
      console.error('API Error in /api/health:', err);
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: err?.message || 'Health check failed' });
      }
    }
  });

  // Mount /api/Mapgov & /api/mapgov (OneMap live catalogue search)
  const handleMapgov = async (req: any, res: any) => {
    try {
      await mapgovHandler(req, res);
    } catch (err: any) {
      console.error('API Error in /api/Mapgov:', err);
      if (!res.headersSent) {
        res.status(502).json({
          status: 'error',
          error: 'Failed to retrieve data from OneMap Singapore.',
          message: err?.message || 'OneMap handler failure',
        });
      }
    }
  };

  app.all('/api/Mapgov', handleMapgov);
  app.all('/api/mapgov', handleMapgov);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
