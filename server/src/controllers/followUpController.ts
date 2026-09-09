import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      status,
      priority,
      assignedToId,
      customerId,
      timeframe,
      search,
      page = '1',
      limit = '50',
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeframe === 'overdue') {
      where.dueDate = { lt: startOfToday };
      where.status = 'PENDING';
    } else if (timeframe === 'today') {
      where.dueDate = { gte: startOfToday, lte: endOfToday };
    } else if (timeframe === 'upcoming') {
      where.dueDate = { gt: endOfToday };
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { customer: { businessName: { contains: search } } },
        { customer: { name: { contains: search } } },
      ];
    }

    const [total, followUps] = await Promise.all([
      prisma.followUp.count({ where }),
      prisma.followUp.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
              city: true,
              customerType: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess({
      res,
      data: followUps,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, assignedToId, reason, dueDate, priority, status, notes } = req.body;

    const followUp = await prisma.followUp.create({
      data: {
        customerId,
        assignedToId,
        reason,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        notes: notes || null,
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    // Update customer next follow-up date
    await prisma.customer.update({
      where: { id: customerId },
      data: { followUpDate: new Date(dueDate) },
    });

    // Create Notification if HIGH priority
    if (priority === 'HIGH') {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: `🔥 High Priority Follow-up: ${followUp.customer.businessName}`,
          message: `${reason} - Due by ${new Date(dueDate).toLocaleDateString('en-IN')}`,
          type: 'OVERDUE_FOLLOWUP',
          link: `/followups`,
        },
      });
    }

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'FOLLOWUP_CREATE',
      entity: 'FollowUp',
      entityId: followUp.id,
      details: { customer: followUp.customer.businessName, priority, reason },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Follow-up task scheduled successfully',
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFollowUpStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, notes, rescheduledDate } = req.body;

    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      return sendError(res, 404, 'Follow-up record not found');
    }

    const updateData: any = {
      status,
    };

    if (notes) {
      updateData.notes = existing.notes ? `${existing.notes}\n[${new Date().toLocaleDateString('en-IN')}]: ${notes}` : notes;
    }

    if (status === 'RESCHEDULED' && rescheduledDate) {
      updateData.dueDate = new Date(rescheduledDate);
      await prisma.customer.update({
        where: { id: existing.customerId },
        data: { followUpDate: new Date(rescheduledDate) },
      });
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: `FOLLOWUP_${status}`,
      entity: 'FollowUp',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status, notes },
      req,
    });

    return sendSuccess({
      res,
      message: `Follow-up marked as ${status.toLowerCase()}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.followUp.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'FOLLOWUP_DELETE',
      entity: 'FollowUp',
      entityId: id,
      req,
    });

    return sendSuccess({
      res,
      message: 'Follow-up removed',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
}
