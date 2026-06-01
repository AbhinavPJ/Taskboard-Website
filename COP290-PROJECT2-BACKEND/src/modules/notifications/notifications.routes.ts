import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  fetchNotifications,
  readAllNotifications,
  readNotification,
} from './notifications.controller';

const router = Router();

//The below endpoint allows us to fetch notifications for a user.
router.get('', Authenticate, fetchNotifications);

//The below endpoint allows us to mark all notifications as read for a user.
router.patch('/read-all', Authenticate, readAllNotifications);

//The below endpoint allows us to mark a specific notification as read.
router.patch('/:id/read', Authenticate, readNotification);

export const notificationRouter = router;
