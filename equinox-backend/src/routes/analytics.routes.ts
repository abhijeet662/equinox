import { Router } from 'express';
import { param } from 'express-validator';
import {
  listConnections,
  connectPlatform,
  disconnectPlatform,
  getSalesHistory,
  getSalesSummary,
  getPriceChanges,
  getBrandSales,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Marketplace connections
router.get('/connections', listConnections);
router.post(
  '/connections/:platform/connect',
  [param('platform').notEmpty()],
  validate,
  connectPlatform,
);
router.post(
  '/connections/:platform/disconnect',
  [param('platform').notEmpty()],
  validate,
  disconnectPlatform,
);

// Sales data
router.get('/sales', getSalesHistory);
router.get('/sales/summary', getSalesSummary);

// Price intelligence
router.get('/price-changes', getPriceChanges);

// Provider brand-wise breakdown
router.get('/brand-sales', getBrandSales);

export default router;
