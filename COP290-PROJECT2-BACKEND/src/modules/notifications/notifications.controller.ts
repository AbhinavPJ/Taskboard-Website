import * as NotificationService from './notifications.service';
import { handleError } from '../../core/middleware/errorhandler';

//Given a user id, fetch all notifications for the user.
export const fetchNotifications = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await NotificationService.fetchNotifications(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a user id, mark his/her notifications as read.
export const readAllNotifications = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await NotificationService.readAllNotifications(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a notification id and user id, mark the notification as read.
export const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ error: 'Notification id is required' });
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await NotificationService.readNotification(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
