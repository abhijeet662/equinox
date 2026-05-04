import { Router } from 'express';
import { body, param } from 'express-validator';
import { listInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, payInvoice } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listInvoices);
router.get('/:id', [param('id').notEmpty()], validate, getInvoiceById);

router.post(
  '/',
  authorize('PROVIDER', 'ADMIN'),
  [
    body('buyerId').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.description').trim().notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  createInvoice
);

router.patch(
  '/:id/status',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('status').isIn(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'DISPUTED']),
  ],
  validate,
  updateInvoiceStatus
);

router.post('/:id/pay', authorize('BUYER'), [param('id').notEmpty()], validate, payInvoice);

export default router;
