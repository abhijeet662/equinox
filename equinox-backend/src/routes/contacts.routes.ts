import { Router } from 'express';
import { body } from 'express-validator';
import { createContact } from '../controllers/contacts.controller';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/contacts — public, no auth required
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('brandName').optional().trim(),
    body('inquiryType')
      .optional()
      .isIn(['provider', 'partnership', 'billing', 'technical', 'general'])
      .withMessage('Invalid inquiry type'),
  ],
  validate,
  createContact
);

export default router;
