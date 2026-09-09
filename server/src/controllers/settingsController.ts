import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

export async function getSystemSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const [warehouses, categories, usersCount, customersCount, productsCount, challansCount] = await Promise.all([
      prisma.warehouse.findMany({
        include: {
          _count: { select: { products: true, stockMovements: true } },
        },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
        },
      }),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.salesChallan.count(),
    ]);

    return sendSuccess({
      res,
      data: {
        company: ENV.COMPANY,
        environment: ENV.NODE_ENV,
        database: {
          provider: 'SQLite (Local) / PostgreSQL (Cloud)',
          totalRecords: {
            users: usersCount,
            customers: customersCount,
            products: productsCount,
            salesChallans: challansCount,
          },
        },
        warehouses,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
}
