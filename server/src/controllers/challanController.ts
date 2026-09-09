import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateChallanNumber } from '../utils/challanNumber.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getChallans(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      status,
      customerId,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { businessName: { contains: search } } },
        { customer: { name: { contains: search } } },
        { customer: { gstNumber: { contains: search } } },
        { vehicleNumber: { contains: search } },
        { dispatchThrough: { contains: search } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
              city: true,
              gstNumber: true,
              customerType: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          confirmedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unit: true,
                  currentStock: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return sendSuccess({
      res,
      data: challans,
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

export async function getChallanById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, phone: true, department: true },
        },
        confirmedBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              include: {
                warehouse: true,
                category: true,
              },
            },
          },
        },
        stockMovements: {
          include: {
            product: true,
            warehouse: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!challan) {
      return sendError(res, 404, 'Sales Challan record not found');
    }

    return sendSuccess({
      res,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
}

export async function previewStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'Items array is required for stock preview');
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { warehouse: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    let allSufficient = true;
    let totalQuantity = 0;
    let estimatedSubtotal = 0;

    const previewItems = items.map((item: any) => {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw { statusCode: 404, message: `Product ID ${item.productId} not found in catalog` };
      }

      const requested = parseInt(item.quantity, 10) || 0;
      const available = prod.currentStock;
      const remaining = available - requested;
      const hasSufficient = requested <= available;
      const shortfall = hasSufficient ? 0 : requested - available;
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : prod.unitPrice;
      const lineTotal = unitPrice * requested;

      if (!hasSufficient) {
        allSufficient = false;
      }

      totalQuantity += requested;
      estimatedSubtotal += lineTotal;

      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        warehouseName: prod.warehouse.name,
        unitPrice,
        availableStock: available,
        requestedQuantity: requested,
        remainingAfterSale: remaining,
        hasSufficientStock: hasSufficient,
        shortfall,
        lineTotal,
        warning: !hasSufficient ? `Insufficient stock — reduce quantity by ${shortfall} units.` : null,
      };
    });

    const taxRate = 18.0;
    const estimatedTax = (estimatedSubtotal * taxRate) / 100;
    const estimatedGrandTotal = estimatedSubtotal + estimatedTax;

    return sendSuccess({
      res,
      data: {
        allSufficient,
        totalQuantity,
        estimatedSubtotal,
        taxRate,
        estimatedTax,
        estimatedGrandTotal,
        items: previewItems,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      customerId,
      status = 'DRAFT',
      items,
      notes,
      terms,
      dispatchThrough,
      vehicleNumber,
      taxRate = 18.0,
    } = req.body;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const challanNumber = await generateChallanNumber();

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return sendError(res, 404, 'Selected customer does not exist', null, 'CUSTOMER_NOT_FOUND');
    }

    // Fetch product details for snapshot
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Build snapshot items and totals
    let totalQuantity = 0;
    let subTotal = 0;
    const snapshotItems: any[] = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return sendError(res, 400, `Product with ID ${item.productId} was not found in catalog.`);
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : prod.unitPrice;
      const quantity = parseInt(item.quantity, 10);
      const lineTotal = unitPrice * quantity;

      totalQuantity += quantity;
      subTotal += lineTotal;

      snapshotItems.push({
        productId: prod.id,
        productNameSnapshot: prod.name,
        skuSnapshot: prod.sku,
        unitPriceSnapshot: unitPrice,
        quantity,
        lineTotal,
      });
    }

    const taxAmount = (subTotal * taxRate) / 100;
    const grandTotal = subTotal + taxAmount;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // If CONFIRMED immediately, validate available stock for all products
      if (status === 'CONFIRMED') {
        for (const item of snapshotItems) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod) {
            throw { statusCode: 404, message: `Product ${item.skuSnapshot} not found` };
          }
          if (prod.currentStock < item.quantity) {
            const shortfall = item.quantity - prod.currentStock;
            throw {
              statusCode: 400,
              message: `Unable to confirm this challan because ${shortfall} units of ${prod.sku} (${prod.name}) are unavailable. Available: ${prod.currentStock}, Requested: ${item.quantity}.`,
              errorCode: 'INSUFFICIENT_STOCK',
              details: { sku: prod.sku, available: prod.currentStock, requested: item.quantity, shortfall },
            };
          }
        }
      }

      // Create SalesChallan
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          status,
          totalQuantity,
          subTotal,
          taxRate,
          taxAmount,
          grandTotal,
          notes: notes || null,
          terms:
            terms ||
            '1. Goods once dispatched are non-returnable unless verified damaged.\n2. Payment due 30 days from dispatch.\n3. Subject to Mumbai Jurisdiction.',
          dispatchThrough: dispatchThrough || null,
          vehicleNumber: vehicleNumber || null,
          createdById: req.user!.userId,
          confirmedById: status === 'CONFIRMED' ? req.user!.userId : null,
          confirmedAt: status === 'CONFIRMED' ? new Date() : null,
          items: {
            create: snapshotItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // If CONFIRMED, atomically deduct stock and log StockMovement OUT
      if (status === 'CONFIRMED') {
        for (const item of snapshotItems) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = prod.currentStock - item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: newStock },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                warehouseId: prod.warehouseId,
                quantity: item.quantity,
                movementType: 'OUT',
                reason: 'SALES_CHALLAN',
                referenceNumber: challan.challanNumber,
                challanId: challan.id,
                createdById: req.user!.userId,
                notes: `Dispatched against confirmed sales challan #${challan.challanNumber} for ${customer.businessName}`,
              },
            });

            // Notification on low stock
            if (newStock <= prod.minStockQuantity) {
              await tx.notification.create({
                data: {
                  title: `⚠️ Low Stock: ${prod.name}`,
                  message: `Inventory depleted to ${newStock} units after challan ${challan.challanNumber}.`,
                  type: 'LOW_STOCK',
                  link: `/inventory?filter=critical`,
                },
              });
            }
          }
        }
      }

      return challan;
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: status === 'CONFIRMED' ? 'CHALLAN_CONFIRM' : 'CHALLAN_CREATE',
      entity: 'SalesChallan',
      entityId: result.id,
      details: {
        challanNumber: result.challanNumber,
        customer: customer.businessName,
        grandTotal: result.grandTotal,
        status: result.status,
      },
      req,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: `Sales Challan ${result.challanNumber} created successfully (${result.status})`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return sendError(res, 404, 'Sales Challan not found');
    }

    if (challan.status === 'CONFIRMED') {
      return sendError(res, 400, 'This sales challan has already been confirmed.', null, 'ALREADY_CONFIRMED');
    }

    if (challan.status === 'CANCELLED') {
      return sendError(res, 400, 'Cannot confirm a cancelled challan. Please create a new sales challan.', null, 'CHALLAN_CANCELLED');
    }

    // Atomic confirmation transaction
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // 1. Verify available stock for every line item
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw { statusCode: 404, message: `Product ${item.skuSnapshot} not found in catalog` };
        }

        if (product.currentStock < item.quantity) {
          const shortfall = item.quantity - product.currentStock;
          throw {
            statusCode: 400,
            message: `Unable to confirm this challan because ${shortfall} units of ${product.sku} (${product.name}) are unavailable. Available stock: ${product.currentStock}, Requested: ${item.quantity}.`,
            errorCode: 'INSUFFICIENT_STOCK',
            details: {
              sku: product.sku,
              productName: product.name,
              available: product.currentStock,
              requested: item.quantity,
              shortfall,
            },
          };
        }
      }

      // 2. Decrement stock & record StockMovement OUT for each item
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = product.currentStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: product.warehouseId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: 'SALES_CHALLAN',
              referenceNumber: challan.challanNumber,
              challanId: challan.id,
              createdById: req.user!.userId,
              notes: `Dispatched against confirmed sales challan #${challan.challanNumber} for ${challan.customer.businessName}`,
            },
          });

          if (newStock <= product.minStockQuantity) {
            await tx.notification.create({
              data: {
                title: `⚠️ Low Stock Alert: ${product.name}`,
                message: `Inventory down to ${newStock} units following confirmation of challan #${challan.challanNumber}.`,
                type: 'LOW_STOCK',
                link: `/inventory?filter=critical`,
              },
            });
          }
        }
      }

      // 3. Mark Challan as CONFIRMED
      const confirmed = await tx.salesChallan.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedById: req.user!.userId,
          confirmedAt: new Date(),
        },
        include: {
          customer: true,
          items: true,
          confirmedBy: { select: { id: true, name: true } },
        },
      });

      return confirmed;
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CHALLAN_CONFIRM',
      entity: 'SalesChallan',
      entityId: challan.id,
      details: {
        challanNumber: challan.challanNumber,
        customer: challan.customer.businessName,
        totalItems: challan.items.length,
        grandTotal: challan.grandTotal,
      },
      req,
    });

    return sendSuccess({
      res,
      message: `Sales Challan #${challan.challanNumber} confirmed and stock successfully deducted`,
      data: updatedChallan,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return sendError(res, 404, 'Sales Challan not found');
    }

    if (challan.status === 'CANCELLED') {
      return sendError(res, 400, 'This sales challan is already cancelled.', null, 'ALREADY_CANCELLED');
    }

    const wasConfirmed = challan.status === 'CONFIRMED';

    const cancelledChallan = await prisma.$transaction(async (tx) => {
      // If was previously CONFIRMED, restore deducted inventory atomically!
      if (wasConfirmed) {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const restoredStock = product.currentStock + item.quantity;

            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: restoredStock },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                warehouseId: product.warehouseId,
                quantity: item.quantity,
                movementType: 'IN',
                reason: 'STOCK_RETURN',
                referenceNumber: `CAN-${challan.challanNumber}`,
                challanId: challan.id,
                createdById: req.user!.userId,
                notes: `Stock restored following cancellation of confirmed challan #${challan.challanNumber}. Reason: ${reason}`,
              },
            });
          }
        }
      }

      // Mark as CANCELLED
      return tx.salesChallan.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledById: req.user!.userId,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CHALLAN_CANCEL',
      entity: 'SalesChallan',
      entityId: challan.id,
      details: {
        challanNumber: challan.challanNumber,
        wasStockRestored: wasConfirmed,
        cancellationReason: reason,
      },
      req,
    });

    return sendSuccess({
      res,
      message: `Sales Challan #${challan.challanNumber} cancelled.${wasConfirmed ? ' Inventory has been safely restored to warehouse.' : ''}`,
      data: cancelledChallan,
    });
  } catch (error) {
    next(error);
  }
}
