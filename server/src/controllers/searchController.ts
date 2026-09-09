import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export async function globalSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as any;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return sendSuccess({
        res,
        data: {
          customers: [],
          products: [],
          challans: [],
          totalResults: 0,
        },
      });
    }

    const query = q.trim();

    const [customers, products, challans] = await Promise.all([
      // Search Customers
      prisma.customer.findMany({
        where: {
          OR: [
            { businessName: { contains: query } },
            { name: { contains: query } },
            { mobile: { contains: query } },
            { email: { contains: query } },
            { gstNumber: { contains: query } },
            { city: { contains: query } },
          ],
        },
        take: 6,
        select: {
          id: true,
          businessName: true,
          name: true,
          mobile: true,
          email: true,
          gstNumber: true,
          city: true,
          customerType: true,
          status: true,
        },
      }),
      // Search Products
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 6,
        include: {
          category: { select: { name: true } },
          warehouse: { select: { name: true, code: true } },
        },
      }),
      // Search Sales Challans
      prisma.salesChallan.findMany({
        where: {
          OR: [
            { challanNumber: { contains: query } },
            { customer: { businessName: { contains: query } } },
            { vehicleNumber: { contains: query } },
            { dispatchThrough: { contains: query } },
          ],
        },
        take: 6,
        include: {
          customer: { select: { businessName: true, city: true } },
        },
      }),
    ]);

    const totalResults = customers.length + products.length + challans.length;

    return sendSuccess({
      res,
      data: {
        query,
        totalResults,
        results: {
          customers: customers.map((c) => ({
            id: c.id,
            type: 'CUSTOMER',
            title: c.businessName,
            subtitle: `${c.name} • ${c.city} • ${c.mobile}`,
            badge: c.customerType,
            link: `/customers/${c.id}`,
          })),
          products: products.map((p) => ({
            id: p.id,
            type: 'PRODUCT',
            title: p.name,
            subtitle: `${p.sku} • In Stock: ${p.currentStock} ${p.unit} • ₹${p.unitPrice.toLocaleString('en-IN')}`,
            badge: p.warehouse.code,
            link: `/inventory?search=${encodeURIComponent(p.sku)}`,
          })),
          challans: challans.map((ch) => ({
            id: ch.id,
            type: 'CHALLAN',
            title: `Challan #${ch.challanNumber}`,
            subtitle: `${ch.customer.businessName} • ₹${ch.grandTotal.toLocaleString('en-IN')} • ${ch.totalQuantity} items`,
            badge: ch.status,
            link: `/challans/${ch.id}`,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
