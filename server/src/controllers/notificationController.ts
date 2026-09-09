import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // broadcast notifications
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return sendSuccess({
      res,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return sendSuccess({
      res,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    return sendSuccess({
      res,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}
