import { Router, Request, Response } from 'express';
import { webhookRoutes } from './webhook-routes';
import { syncRoutes } from './sync-routes';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Express API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      webhooks: {
        amocrm: '/api/webhooks/amocrm',
      },
      sync: {
        budget: '/api/sync/budget/:leadId',
        budgetAll: '/api/sync/budget/all',
        testConnections: '/api/sync/test-connections'
      }
    }
  });
});

router.use('/webhooks', webhookRoutes);
router.use('/sync', syncRoutes);

export { router as apiRoutes }; 