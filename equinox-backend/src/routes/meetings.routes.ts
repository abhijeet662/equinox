import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting,
  generateMom, markAttendance, addActionItem, toggleActionItem,
} from '../controllers/meetings.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listMeetings);
router.get('/:id', [param('id').notEmpty()], validate, getMeetingById);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduledAt date required'),
    body('type').optional().isIn(['STANDUP', 'PLANNING', 'REVIEW', 'RETROSPECTIVE', 'CLIENT', 'ONE_ON_ONE', 'OTHER']),
    body('duration').optional().isInt({ min: 1 }),
    body('attendeeIds').optional().isArray(),
  ],
  validate,
  createMeeting
);

router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    body('type').optional().isIn(['STANDUP', 'PLANNING', 'REVIEW', 'RETROSPECTIVE', 'CLIENT', 'ONE_ON_ONE', 'OTHER']),
    body('scheduledAt').optional().isISO8601(),
  ],
  validate,
  updateMeeting
);

router.delete('/:id', [param('id').notEmpty()], validate, deleteMeeting);

// MoM generation
router.post('/:id/mom', [param('id').notEmpty()], validate, generateMom);

// Attendance
router.patch(
  '/:id/attendance',
  [param('id').notEmpty(), body('userId').notEmpty(), body('attended').isBoolean()],
  validate,
  markAttendance
);

// Action items
router.post(
  '/:id/action-items',
  [param('id').notEmpty(), body('description').trim().notEmpty()],
  validate,
  addActionItem
);

router.patch(
  '/action-items/:itemId/toggle',
  [param('itemId').notEmpty()],
  validate,
  toggleActionItem
);

export default router;
