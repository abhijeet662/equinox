import { Router } from 'express';
import { body, param } from 'express-validator';
import { listContracts, getContractById, createContract, updateContract, deleteContract } from '../controllers/contracts.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listContracts);
router.get('/:id', [param('id').notEmpty()], validate, getContractById);

router.post(
  '/',
  authorize('BUYER', 'ADMIN'),
  [
    body('title').trim().notEmpty(),
    body('providerId').notEmpty(),
    body('type').optional().isIn(['PROJECT', 'RETAINER', 'MILESTONE', 'HOURLY', 'FIXED_PRICE']),
    body('value').optional().isNumeric(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  createContract
);

router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('status').optional().isIn(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
    body('type').optional().isIn(['PROJECT', 'RETAINER', 'MILESTONE', 'HOURLY', 'FIXED_PRICE']),
  ],
  validate,
  updateContract
);

router.delete('/:id', [param('id').notEmpty()], validate, deleteContract);

export default router;
