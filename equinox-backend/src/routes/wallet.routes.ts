import { Router } from 'express';
import { body } from 'express-validator';
import { getMyWallet, listTransactions, topUp, withdraw, adminListWallets } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/me', getMyWallet);
router.get('/me/transactions', listTransactions);

router.post(
  '/me/topup',
  [body('amount').isFloat({ min: 0.01 })],
  validate,
  topUp
);

router.post(
  '/me/withdraw',
  [body('amount').isFloat({ min: 0.01 })],
  validate,
  withdraw
);

// Admin routes
router.get('/', authorize('ADMIN'), adminListWallets);

export default router;
