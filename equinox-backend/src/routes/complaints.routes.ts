import { Router } from 'express';
import { body, param } from 'express-validator';
import { listComplaints, getComplaintById, createComplaint, updateComplaintStatus, escalateComplaint } from '../controllers/complaints.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listComplaints);
router.get('/:id', [param('id').notEmpty()], validate, getComplaintById);

router.post(
  '/',
  authorize('BUYER', 'PROVIDER'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('againstId').notEmpty(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  ],
  validate,
  createComplaint
);

router.patch('/:id/escalate', authorize('BUYER'), [param('id').notEmpty()], validate, escalateComplaint);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'EMPLOYEE'),
  [
    param('id').notEmpty(),
    body('status').isIn(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED', 'ESCALATED' ]),
  ],
  validate,
  updateComplaintStatus
);

export default router;
