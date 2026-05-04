import { Router } from 'express';
import { body, param } from 'express-validator';
import { listTasks, getTaskById, createTask, updateTask, deleteTask, taskSummary, getScorecardStats, certEligibility, capacityCheck } from '../controllers/tasks.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listTasks);
router.get('/summary', taskSummary);
router.get('/scorecard', getScorecardStats);
router.get('/cert-eligibility', certEligibility);
router.get('/capacity-check', capacityCheck);
router.get('/:id', [param('id').notEmpty()], validate, getTaskById);

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('priority').optional().isIn(['P0', 'P1', 'P2', 'P3']),
    body('dueDate').optional().isISO8601(),
    body('slaHours').optional().isNumeric(),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE' ]),
    body('priority').optional().isIn(['P0', 'P1', 'P2', 'P3']),
  ],
  validate,
  updateTask
);

router.delete('/:id', [param('id').notEmpty()], validate, deleteTask);

export default router;
