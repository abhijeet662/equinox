import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, logout, me, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['BUYER', 'PROVIDER', 'EMPLOYEE', 'ADMIN']),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

// POST /api/auth/refresh
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', authenticate, me);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  changePassword
);

export default router;
