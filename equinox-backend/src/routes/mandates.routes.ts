import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listMandates, getMandateById, createMandate, updateMandateStatus, cancelMandate, getMyMandate,
} from '../controllers/mandates.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// User routes
router.get('/my', getMyMandate);
router.get('/', authorize('ADMIN'), listMandates);
router.get('/:id', [param('id').notEmpty()], validate, getMandateById);

router.post(
  '/',
  [
    body('bankName').trim().notEmpty().withMessage('Bank name is required'),
    body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
    body('ifscCode').trim().notEmpty().withMessage('IFSC code is required'),
    body('accountHolder').trim().notEmpty().withMessage('Account holder name is required'),
    body('maxAmount').isFloat({ min: 1 }).withMessage('Max amount must be a positive number'),
    body('frequency').optional().isIn(['MONTHLY', 'WEEKLY', 'QUARTERLY']),
    body('nextDebitDate').optional().isISO8601(),
  ],
  validate,
  createMandate
);

// Admin: update status (activate, pause, fail)
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('status').isIn(['PENDING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED']),
  ],
  validate,
  updateMandateStatus
);

// Owner or admin: cancel
router.patch('/:id/cancel', [param('id').notEmpty()], validate, cancelMandate);

export default router;
