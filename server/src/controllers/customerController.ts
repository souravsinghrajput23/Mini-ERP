import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      search,
      customerType,
      status,
      city,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { gstNumber: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (customerType && customerType !== 'ALL') {
      where.customerType = customerType;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (city) {
      where.city = { contains: city };
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              salesChallans: true,
              followUps: true,
              customerNotes: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess({
      res,
      data: customers,
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

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerNotes: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
          orderBy: { dueDate: 'asc' },
        },
        salesChallans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, 404, 'Customer record not found');
    }

    return sendSuccess({
      res,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomer360(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerNotes: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
          orderBy: { dueDate: 'asc' },
        },
        salesChallans: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            createdBy: { select: { id: true, name: true } },
            confirmedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, 404, 'Customer record not found');
    }

    // Calculate aggregated financial & sales metrics
    const confirmedChallans = customer.salesChallans.filter(c => c.status === 'CONFIRMED');
    const totalSpend = confirmedChallans.reduce((sum, c) => sum + c.grandTotal, 0);
    const totalQuantityPurchased = confirmedChallans.reduce((sum, c) => sum + c.totalQuantity, 0);
    const averageOrderValue = confirmedChallans.length > 0 ? totalSpend / confirmedChallans.length : 0;

    // Build unified chronological visual activity timeline
    const timeline: any[] = [];

    // 1. Customer created
    timeline.push({
      id: `cust-created-${customer.id}`,
      type: 'CUSTOMER_CREATED',
      title: 'Customer Onboarded',
      description: `Account registered as ${customer.customerType} under ${customer.businessName}`,
      timestamp: customer.createdAt,
      actor: 'System',
      badgeColor: 'emerald',
    });

    // 2. Challan events
    for (const ch of customer.salesChallans) {
      timeline.push({
        id: `ch-created-${ch.id}`,
        type: 'CHALLAN_GENERATED',
        title: `Sales Challan Generated (#${ch.challanNumber})`,
        description: `Draft order for ${ch.totalQuantity} items worth ₹${ch.grandTotal.toLocaleString('en-IN')}`,
        timestamp: ch.createdAt,
        actor: ch.createdBy.name,
        badgeColor: 'indigo',
        meta: { challanId: ch.id, status: ch.status, grandTotal: ch.grandTotal },
      });

      if (ch.confirmedAt) {
        timeline.push({
          id: `ch-confirmed-${ch.id}`,
          type: 'CHALLAN_CONFIRMED',
          title: `Sales Challan Confirmed (#${ch.challanNumber})`,
          description: `Inventory deducted & dispatched via ${ch.dispatchThrough || 'Logistics'}`,
          timestamp: ch.confirmedAt,
          actor: ch.confirmedBy?.name || 'Administrator',
          badgeColor: 'blue',
          meta: { challanId: ch.id, challanNumber: ch.challanNumber },
        });
      }

      if (ch.cancelledAt) {
        timeline.push({
          id: `ch-cancelled-${ch.id}`,
          type: 'CHALLAN_CANCELLED',
          title: `Sales Challan Cancelled (#${ch.challanNumber})`,
          description: ch.cancellationReason || 'Order cancelled and stock restored',
          timestamp: ch.cancelledAt,
          actor: 'Operations Team',
          badgeColor: 'rose',
        });
      }
    }

    // 3. Follow-up events
    for (const fu of customer.followUps) {
      timeline.push({
        id: `fu-${fu.id}`,
        type: 'FOLLOW_UP',
        title: `Follow-up ${fu.status === 'COMPLETED' ? 'Completed' : 'Scheduled'}`,
        description: `${fu.reason} (Priority: ${fu.priority})`,
        timestamp: fu.updatedAt || fu.createdAt,
        actor: fu.assignedTo.name,
        badgeColor: fu.status === 'COMPLETED' ? 'emerald' : fu.priority === 'HIGH' ? 'amber' : 'slate',
        meta: { followUpId: fu.id, status: fu.status },
      });
    }

    // 4. Notes events
    for (const note of customer.customerNotes) {
      timeline.push({
        id: `note-${note.id}`,
        type: 'NOTE_ADDED',
        title: 'Note Logged',
        description: note.note,
        timestamp: note.createdAt,
        actor: note.author.name,
        badgeColor: 'purple',
      });
    }

    // Sort timeline descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Next upcoming follow-up
    const nextFollowUp = customer.followUps.find(f => f.status === 'PENDING' && new Date(f.dueDate) >= new Date()) ||
      customer.followUps.find(f => f.status === 'PENDING');

    return sendSuccess({
      res,
      data: {
        customer,
        metrics: {
          totalSpend,
          totalOrders: customer.salesChallans.length,
          confirmedOrders: confirmedChallans.length,
          totalQuantityPurchased,
          averageOrderValue,
        },
        nextFollowUp,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email || null,
        businessName: data.businessName,
        gstNumber: data.gstNumber ? data.gstNumber.toUpperCase() : null,
        customerType: data.customerType || 'WHOLESALE',
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode || null,
        status: data.status || 'ACTIVE',
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'CUSTOMER_CREATE',
      entity: 'Customer',
      entityId: customer.id,
      details: { businessName: customer.businessName, type: customer.customerType, gst: customer.gstNumber },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        gstNumber: data.gstNumber ? data.gstNumber.toUpperCase() : undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'CUSTOMER_UPDATE',
      entity: 'Customer',
      entityId: updated.id,
      details: data,
      req,
    });

    return sendSuccess({
      res,
      message: 'Customer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Check for confirmed challans
    const hasConfirmedChallans = await prisma.salesChallan.findFirst({
      where: { customerId: id, status: 'CONFIRMED' },
    });

    if (hasConfirmedChallans) {
      return sendError(
        res,
        400,
        'Cannot delete customer with confirmed sales challans in the audit ledger. Set status to INACTIVE instead.',
        null,
        'CUSTOMER_HAS_CONFIRMED_CHALLANS'
      );
    }

    const customer = await prisma.customer.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'CUSTOMER_DELETE',
      entity: 'Customer',
      entityId: id,
      details: { businessName: customer.businessName },
      req,
    });

    return sendSuccess({
      res,
      message: 'Customer removed successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
}

export async function addCustomerNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        authorId: req.user.userId,
        note,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'NOTE_CREATE',
      entity: 'CustomerNote',
      entityId: newNote.id,
      details: { customerId: id, noteSnippet: note.slice(0, 50) },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Note added to customer timeline',
      data: newNote,
    });
  } catch (error) {
    next(error);
  }
}
