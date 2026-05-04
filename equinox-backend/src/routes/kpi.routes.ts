import { Router } from 'express';
import { body, param } from 'express-validator';
import { listKPIs, createKPI, updateKPI, teamKPIDashboard } from '../controllers/kpi.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listKPIs);
router.get('/team', authorize('ADMIN'), teamKPIDashboard);

router.post(
  '/',
  [
    body('metric').trim().notEmpty(),
    body('value').isNumeric(),
    body('period').trim().notEmpty(),
    body('target').optional().isNumeric(),
    body('unit').optional().trim(),
  ],
  validate,
  createKPI
);

router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('value').optional().isNumeric(),
    body('target').optional().isNumeric(),
  ],
  validate,
  updateKPI
);

export default router;
