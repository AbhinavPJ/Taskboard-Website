import {prisma} from '../../core/database/db';

export const fetchNotifications = async (userId: string) => {
  //Fetch all notifications for the user.
  return prisma.notification.findMany({
    where: {
      userId: userId,
    },
  });
};

export const readAllNotifications = async (userId: string) => {
  //Mark all notifications as read for the user.
  await prisma.notification.updateMany({
    where: {userId: userId},
    data: {read: true},
  });
  return {ok: true};
};

export const readNotification = async (id: string, userId: string) => {
  //Mark a specific notification as read for the user.
  await prisma.notification.updateMany({
    where: {id: id, userId: userId},
    data: {read: true},
  });
  return {ok: true};
};
