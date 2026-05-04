import { Router } from 'express';
import { param } from 'express-validator';
import { listNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', [param('id').notEmpty()], validate, markRead);
router.delete('/:id', [param('id').notEmpty()], validate, deleteNotification);

export default router;
