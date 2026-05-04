import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listUsers, getUserById, updateProfile,
  updateUserStatus, adminResetPassword, deleteUser, adminStats,
  adminCreateUser, adminUpdateRole,
  getWorkforce, getAvailableAssignees,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users — admin only
router.get('/', authorize('ADMIN'), listUsers);

// POST /api/users — admin only
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('role').isIn(['ADMIN', 'PROVIDER', 'BUYER', 'EMPLOYEE']).withMessage('Invalid role'),
  ],
  validate,
  adminCreateUser
);

// GET /api/users/stats — admin only
router.get('/stats', authorize('ADMIN'), adminStats);

// GET /api/users/workforce — admin: all employees with live task load & leave status
router.get('/workforce', authorize('ADMIN'), getWorkforce);

// GET /api/users/available-assignees — any authenticated user; filters out employees on leave today
router.get('/available-assignees', getAvailableAssignees);

// GET /api/users/:id
router.get('/:id', [param('id').notEmpty()], validate, getUserById);

// PUT /api/users/profile — update own profile
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('timezone').optional().trim(),
  ],
  validate,
  updateProfile
);

// PATCH /api/users/:id/role — admin only
router.patch(
  '/:id/role',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('role').isIn(['ADMIN', 'PROVIDER', 'BUYER', 'EMPLOYEE']),
  ],
  validate,
  adminUpdateRole
);

// PATCH /api/users/:id/status — admin only
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('status').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']),
  ],
  validate,
  updateUserStatus
);

// POST /api/users/:id/reset-password — admin only
router.post(
  '/:id/reset-password',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  adminResetPassword
);

// DELETE /api/users/:id — admin only
router.delete('/:id', authorize('ADMIN'), [param('id').notEmpty()], validate, deleteUser);

export default router;
