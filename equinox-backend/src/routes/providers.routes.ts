import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listProviders, getProviderById, getMyProfile,
  updateMyProfile, getProviderStats, listCategories,
  verifyProvider, featureProvider, suspendProvider,
  getProviderAdminDetail, listAllProvidersAdmin,
  getPendingProviders, approveProvider, rejectProvider,
  applyForVerification, setProviderSubscription, getMyFeaturedStatus,
} from '../controllers/providers.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', listProviders);
router.get('/categories', listCategories);

// ── /me/* — MUST be registered before /:id ──────────────────────────────────
router.get('/me/profile',         authenticate, authorize('PROVIDER'), getMyProfile);
router.get('/me/stats',           authenticate, authorize('PROVIDER'), getProviderStats);
router.get('/me/featured-status', authenticate, authorize('PROVIDER'), getMyFeaturedStatus);

router.put(
  '/me/profile',
  authenticate,
  authorize('PROVIDER'),
  [
    body('businessName').optional().trim().notEmpty(),
    body('category').optional().trim(),
    body('services').optional().isArray(),
  ],
  validate,
  updateMyProfile,
);

router.post(
  '/me/apply-verification',
  authenticate,
  authorize('PROVIDER'),
  [body('documentUrls').optional().isArray().withMessage('documentUrls must be an array')],
  validate,
  applyForVerification,
);

// ── /admin/* — also before /:id ───────────────────────────────────────────────
router.get('/admin/all',     authenticate, authorize('ADMIN'), listAllProvidersAdmin);
router.get('/admin/pending', authenticate, authorize('ADMIN'), getPendingProviders);

// ── /:id dynamic routes ───────────────────────────────────────────────────────
router.get('/:id', getProviderById);

router.get(
  '/:id/admin-detail',
  authenticate,
  authorize('ADMIN'),
  [param('id').notEmpty()],
  validate,
  getProviderAdminDetail,
);

router.post('/:id/approve', authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, approveProvider);
router.post('/:id/reject',  authenticate, authorize('ADMIN'), [param('id').notEmpty(), body('reason').trim().notEmpty().withMessage('Rejection reason required')], validate, rejectProvider);

router.patch('/:id/verify',       authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, verifyProvider);
router.patch('/:id/feature',      authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, featureProvider);
router.patch('/:id/suspend',      authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, suspendProvider);
router.patch('/:id/subscription', authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, setProviderSubscription);

export default router;
