import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getStockMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      productId,
      warehouseId,
      movementType,
      reason,
      search,
      page = '1',
      limit = '20',
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId && warehouseId !== 'ALL') {
      where.warehouseId = warehouseId;
    }

    if (movementType && movementType !== 'ALL') {
      where.movementType = movementType;
    }

    if (reason && reason !== 'ALL') {
      where.reason = reason;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search } },
        { notes: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              unitPrice: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
          challan: {
            select: {
              id: true,
              challanNumber: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess({
      res,
      data: movements,
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

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, warehouseId, quantity, movementType, reason, referenceNumber, notes } = req.body;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw { statusCode: 404, message: 'Product record not found', errorCode: 'PRODUCT_NOT_FOUND' };
      }

      const targetWarehouseId = warehouseId || product.warehouseId;
      let newStock = product.currentStock;

      if (movementType === 'OUT') {
        if (product.currentStock < quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient inventory: Current stock is ${product.currentStock} ${product.unit}, cannot deduct ${quantity} ${product.unit}. Operation aborted.`,
            errorCode: 'INSUFFICIENT_STOCK',
            details: { available: product.currentStock, requested: quantity, shortfall: quantity - product.currentStock },
          };
        }
        newStock = product.currentStock - quantity;
      } else {
        newStock = product.currentStock + quantity;
      }

      // Update product currentStock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create StockMovement entry
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: targetWarehouseId,
          quantity,
          movementType,
          reason,
          referenceNumber: referenceNumber || (movementType === 'IN' ? 'PO-MANUAL' : 'ADJ-OUT'),
          createdById: req.user!.userId,
          notes,
        },
        include: {
          product: true,
          warehouse: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      // If new stock is critical, trigger notification
      if (newStock <= product.minStockQuantity) {
        await tx.notification.create({
          data: {
            title: `⚠️ Stock Alert: ${product.name}`,
            message: `Current stock dropped to ${newStock} ${product.unit} (Minimum threshold: ${product.minStockQuantity}). Please initiate replenishment.`,
            type: 'LOW_STOCK',
            link: `/inventory?filter=critical`,
          },
        });
      }

      return { product: updatedProduct, movement };
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: movementType === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
      entity: 'StockMovement',
      entityId: result.movement.id,
      details: {
        productName: result.product.name,
        sku: result.product.sku,
        quantity,
        movementType,
        reason,
        newStock: result.product.currentStock,
      },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: `Stock successfully adjusted (${movementType === 'IN' ? '+' : '-'}${quantity} ${result.product.unit})`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
