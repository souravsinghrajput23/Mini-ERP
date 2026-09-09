import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';

export function calculateProductHealth(currentStock: number, minStock: number): {
  status: 'HEALTHY' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  color: string;
  label: string;
} {
  if (currentStock <= 0) {
    return { status: 'OUT_OF_STOCK', color: 'slate', label: 'Out of Stock' };
  }
  if (currentStock <= minStock) {
    return { status: 'CRITICAL', color: 'rose', label: 'Critical' };
  }
  if (currentStock <= Math.floor(minStock * 1.5)) {
    return { status: 'LOW', color: 'amber', label: 'Low Stock' };
  }
  return { status: 'HEALTHY', color: 'emerald', label: 'Healthy' };
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      search,
      categoryId,
      warehouseId,
      health,
      page = '1',
      limit = '12',
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
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (warehouseId && warehouseId !== 'ALL') {
      where.warehouseId = warehouseId;
    }

    // Health-specific SQL/Prisma where logic
    if (health === 'OUT_OF_STOCK') {
      where.currentStock = 0;
    } else if (health === 'CRITICAL') {
      where.AND = [
        { currentStock: { gt: 0 } },
        // SQLite/Prisma comparison can also be post-filtered or handled via standard range
      ];
    }

    const [total, productsRaw, categories, warehouses, stats] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          warehouse: true,
        },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
      prisma.product.aggregate({
        _sum: {
          currentStock: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Enrich with dynamic inventory health calculation
    const products = productsRaw.map((p) => {
      const health = calculateProductHealth(p.currentStock, p.minStockQuantity);
      return {
        ...p,
        inventoryHealth: health,
        valuation: p.currentStock * p.unitPrice,
      };
    });

    // Optional post-filter for exact health if requested
    let finalProducts = products;
    if (health && ['CRITICAL', 'LOW', 'HEALTHY'].includes(health)) {
      finalProducts = products.filter(p => p.inventoryHealth.status === health);
    }

    return sendSuccess({
      res,
      data: finalProducts,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalStockUnits: stats._sum.currentStock || 0,
        totalCatalogCount: stats._count.id || 0,
        categories,
        warehouses,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        warehouse: true,
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    const health = calculateProductHealth(product.currentStock, product.minStockQuantity);

    return sendSuccess({
      res,
      data: {
        ...product,
        inventoryHealth: health,
        valuation: product.currentStock * product.unitPrice,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku.toUpperCase().trim() },
    });

    if (existingSku) {
      return sendError(res, 409, `A product with SKU '${data.sku}' already exists in catalog`, null, 'DUPLICATE_SKU');
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku.toUpperCase().trim(),
          categoryId: data.categoryId,
          unitPrice: data.unitPrice,
          currentStock: data.currentStock || 0,
          minStockQuantity: data.minStockQuantity || 10,
          warehouseId: data.warehouseId,
          unit: data.unit || 'PCS',
          imageUrl: data.imageUrl || null,
          description: data.description || null,
        },
        include: {
          category: true,
          warehouse: true,
        },
      });

      // If initial stock is provided, log initial stock movement
      if (data.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            warehouseId: created.warehouseId,
            quantity: data.currentStock,
            movementType: 'IN',
            reason: 'PURCHASE_RECEIVED',
            referenceNumber: 'INITIAL-STOCK',
            createdById: req.user?.userId || 'system',
            notes: 'Initial inventory onboarded with product creation.',
          },
        });
      }

      return created;
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'PRODUCT_CREATE',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, sku: product.sku, initialStock: product.currentStock },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: 'Product registered in catalog successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: data.sku.toUpperCase().trim(),
          id: { not: id },
        },
      });
      if (existingSku) {
        return sendError(res, 409, `SKU '${data.sku}' is already assigned to another product`, null, 'DUPLICATE_SKU');
      }
      data.sku = data.sku.toUpperCase().trim();
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        warehouse: true,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'PRODUCT_UPDATE',
      entity: 'Product',
      entityId: updated.id,
      details: data,
      req,
    });

    return sendSuccess({
      res,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Check if product is in confirmed challans
    const hasConfirmedChallans = await prisma.salesChallanItem.findFirst({
      where: {
        productId: id,
        challan: {
          status: 'CONFIRMED',
        },
      },
    });

    if (hasConfirmedChallans) {
      return sendError(
        res,
        400,
        'Cannot delete product linked to confirmed sales challans in the audit ledger.',
        null,
        'PRODUCT_IN_CONFIRMED_CHALLAN'
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'PRODUCT_DELETE',
      entity: 'Product',
      entityId: id,
      req,
    });

    return sendSuccess({
      res,
      message: 'Product removed from catalog',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    return sendSuccess({ res, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getWarehouses(req: Request, res: Response, next: NextFunction) {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true, stockMovements: true } },
      },
    });
    return sendSuccess({ res, data: warehouses });
  } catch (error) {
    next(error);
  }
}
