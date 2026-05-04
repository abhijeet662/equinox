import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listAssets, getAssetById, createAsset, updateAsset, deleteAsset,
  offboardUser, getUserAssets,
} from '../controllers/assets.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

const ASSET_TYPES = [
  'LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'SERVER',
  'SOFTWARE_LICENSE', 'API_KEY', 'MARKETPLACE_CREDENTIAL', 'OTHER_HARDWARE', 'OTHER_SOFTWARE',
];
const ASSET_STATUSES = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'REVOKED', 'RETIRED', 'LOST'];

// ─── ADMIN-ONLY: full CRUD + offboarding ─────────────────────────────────────

router.get('/', authorize('ADMIN'), listAssets);
router.get('/user/:userId', authorize('ADMIN'), [param('userId').notEmpty()], validate, getUserAssets);

router.post(
  '/offboard/:userId',
  authorize('ADMIN'),
  [param('userId').notEmpty()],
  validate,
  offboardUser,
);

router.get('/:id', authorize('ADMIN'), [param('id').notEmpty()], validate, getAssetById);

router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Asset name is required'),
    body('type').isIn(ASSET_TYPES).withMessage('Invalid asset type'),
    body('category').isIn(['HARDWARE', 'SOFTWARE']).withMessage('Category must be HARDWARE or SOFTWARE'),
    body('status').optional().isIn(ASSET_STATUSES),
    body('serialNo').optional().trim(),
    body('platform').optional().trim(),
    body('description').optional().trim(),
  ],
  validate,
  createAsset,
);

router.put(
  '/:id',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(ASSET_TYPES),
    body('category').optional().isIn(['HARDWARE', 'SOFTWARE']),
    body('status').optional().isIn(ASSET_STATUSES),
  ],
  validate,
  updateAsset,
);

router.delete('/:id', authorize('ADMIN'), [param('id').notEmpty()], validate, deleteAsset);

export default router;
