import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listReviews, createReview, listAllReviews, deleteReview,
  getModerationQueue, approveReview, rejectReview, flagReview,
} from '../controllers/reviews.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

// Public: published reviews for a provider
router.get('/provider/:providerId', [param('providerId').notEmpty()], validate, listReviews);

// Protected: submit review (BUYER only)
router.post(
  '/',
  authenticate,
  authorize('BUYER'),
  [
    body('providerId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
    body('contractId').optional().notEmpty(),
  ],
  validate,
  createReview
);

// Admin: moderation queue (PENDING + FLAGGED)
router.get('/admin/queue', authenticate, authorize('ADMIN'), getModerationQueue);

// Admin: list all reviews (with optional ?status= filter)
router.get('/', authenticate, authorize('ADMIN'), listAllReviews);

// Admin: approve / reject / flag
router.patch('/:id/approve', authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, approveReview);
router.patch('/:id/reject',  authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, rejectReview);
router.patch('/:id/flag',    authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, flagReview);

// Admin: delete
router.delete('/:id', authenticate, authorize('ADMIN'), [param('id').notEmpty()], validate, deleteReview);

export default router;
