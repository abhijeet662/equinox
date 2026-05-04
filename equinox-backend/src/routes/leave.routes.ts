import { Router } from 'express';
import { body, param } from 'express-validator';
import { listLeaveRequests, createLeaveRequest, reviewLeaveRequest, cancelLeaveRequest } from '../controllers/leave.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listLeaveRequests);

router.post(
  '/',
  authorize('EMPLOYEE'),
  [
    body('type').isIn(['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER' ]),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('reason').optional().trim(),
  ],
  validate,
  createLeaveRequest
);

router.patch(
  '/:id/review',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('status').isIn(['APPROVED', 'REJECTED']),
  ],
  validate,
  reviewLeaveRequest
);

router.patch(
  '/:id/cancel',
  authorize('EMPLOYEE'),
  [param('id').notEmpty()],
  validate,
  cancelLeaveRequest
);

export default router;
