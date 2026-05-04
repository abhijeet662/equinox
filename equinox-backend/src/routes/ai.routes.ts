import { Router } from 'express';
import { body, param } from 'express-validator';
import { getInsights, copilotChat, generateInvoiceSummary, dashboardSummary } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/insights', getInsights);
router.get('/dashboard-summary', dashboardSummary);
router.get('/invoice-summary/:invoiceId', [param('invoiceId').notEmpty()], validate, generateInvoiceSummary);

router.post(
  '/copilot',
  [body('message').trim().notEmpty()],
  validate,
  copilotChat
);

export default router;
