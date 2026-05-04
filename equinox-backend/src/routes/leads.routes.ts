import { Router } from 'express';
import { body } from 'express-validator';
import { createLead } from '../controllers/leads.controller';
import { validate } from '../middleware/validate';

const router = Router();

/**
 * POST /api/leads — public, no auth required.
 * Accepts a guest inquiry form and notifies the target provider.
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('providerId').notEmpty().withMessage('Provider ID is required'),
    body('company').optional().trim(),
    body('budget').optional().trim(),
  ],
  validate,
  createLead
);

export default router;
