import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';
import {
  securityHeadersMiddleware,
  generalApiLimiter,
  inputSanitizerMiddleware,
} from './src/server/security';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers (Anti-XSS, Anti-Clickjacking, Strict MIME)
  app.use(securityHeadersMiddleware);

  // 2. Global parsing middleware with safe limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Advanced input payload sanitizer (Blocks XSS, injection scripts, prototype pollution)
  app.use(inputSanitizerMiddleware);

  // 4. Rate Limiter for API endpoints
  app.use('/api', generalApiLimiter);

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Cryptic.io] Vite dev middleware attached in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Cryptic.io] Serving static production bundle from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cryptic.io Rewards] Full-stack application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Cryptic.io Rewards] Failed to initialize server:', err);
  process.exit(1);
});
