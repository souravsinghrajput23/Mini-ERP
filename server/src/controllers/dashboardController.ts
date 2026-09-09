import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [
      allConfirmedChallans,
      currentMonthConfirmedChallans,
      prevMonthConfirmedChallans,
      totalCustomers,
      prevMonthCustomers,
      pendingFollowUps,
      overdueFollowUps,
      allProducts,
      challansThisMonthCount,
      prevMonthChallansCount,
      customerTypesRaw,
      challanStatusesRaw,
      topChallanItems,
    ] = await Promise.all([
      // Total Revenue
      prisma.salesChallan.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { grandTotal: true, totalQuantity: true },
        _count: { id: true },
      }),
      // Current Month Revenue
      prisma.salesChallan.aggregate({
        where: { status: 'CONFIRMED', createdAt: { gte: startOfCurrentMonth } },
        _sum: { grandTotal: true },
      }),
      // Previous Month Revenue
      prisma.salesChallan.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
        },
        _sum: { grandTotal: true },
      }),
      // Total Customers
      prisma.customer.count(),
      // Previous Month Customers
      prisma.customer.count({
        where: { createdAt: { lte: endOfPreviousMonth } },
      }),
      // Pending Follow-ups
      prisma.followUp.count({
        where: { status: 'PENDING' },
      }),
      // Overdue Follow-ups
      prisma.followUp.count({
        where: { status: 'PENDING', dueDate: { lt: startOfToday } },
      }),
      // All Products for valuation & health
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          unitPrice: true,
          currentStock: true,
          minStockQuantity: true,
          unit: true,
        },
      }),
      // Challans created this month
      prisma.salesChallan.count({
        where: { createdAt: { gte: startOfCurrentMonth } },
      }),
      // Challans created prev month
      prisma.salesChallan.count({
        where: { createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth } },
      }),
      // Customer Type grouping
      prisma.customer.groupBy({
        by: ['customerType'],
        _count: { id: true },
      }),
      // Challan status breakdown
      prisma.salesChallan.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Top items
      prisma.salesChallanItem.findMany({
        where: {
          challan: { status: 'CONFIRMED' },
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
    ]);

    // Calculate Inventory Valuation & Low Stock Count
    let inventoryValuation = 0;
    let lowStockCount = 0;
    let criticalStockCount = 0;

    for (const p of allProducts) {
      inventoryValuation += p.currentStock * p.unitPrice;
      if (p.currentStock <= p.minStockQuantity) {
        lowStockCount++;
      }
      if (p.currentStock <= Math.floor(p.minStockQuantity * 0.5)) {
        criticalStockCount++;
      }
    }

    // Revenue growth comparison
    const curMonthRev = currentMonthConfirmedChallans._sum.grandTotal || 0;
    const prevMonthRev = prevMonthConfirmedChallans._sum.grandTotal || 1; // avoid divide by zero
    const revenueGrowthPct = prevMonthRev > 0 ? ((curMonthRev - prevMonthRev) / prevMonthRev) * 100 : 100;

    // Customer growth comparison
    const customerGrowthCount = totalCustomers - prevMonthCustomers;

    // Top Selling Products Calculation
    const productSalesMap = new Map<string, { id: string; name: string; sku: string; quantity: number; totalRevenue: number }>();
    for (const item of topChallanItems) {
      const existing = productSalesMap.get(item.productId) || {
        id: item.productId,
        name: item.productNameSnapshot,
        sku: item.skuSnapshot,
        quantity: 0,
        totalRevenue: 0,
      };
      existing.quantity += item.quantity;
      existing.totalRevenue += item.lineTotal;
      productSalesMap.set(item.productId, existing);
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Monthly Sales Trend (Last 6 Months)
    const salesTrend = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthChallans = await prisma.salesChallan.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { grandTotal: true, totalQuantity: true },
        _count: { id: true },
      });

      salesTrend.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        revenue: monthChallans._sum.grandTotal || 0,
        volume: monthChallans._sum.totalQuantity || 0,
        orders: monthChallans._count.id || 0,
      });
    }

    // Customer Type Distribution
    const customerDistribution = customerTypesRaw.map(c => ({
      type: c.customerType,
      count: c._count.id,
      percentage: totalCustomers > 0 ? Math.round((c._count.id / totalCustomers) * 100) : 0,
    }));

    // Challan Status Breakdown
    const totalChallansCount = challanStatusesRaw.reduce((sum, s) => sum + s._count.id, 0);
    const challanStatusBreakdown = challanStatusesRaw.map(s => ({
      status: s.status,
      count: s._count.id,
      percentage: totalChallansCount > 0 ? Math.round((s._count.id / totalChallansCount) * 100) : 0,
    }));

    // Stock Movement Activity (IN vs OUT past 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const recentMovements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { movementType: true, quantity: true, createdAt: true },
    });

    let totalInQty = 0;
    let totalOutQty = 0;
    for (const m of recentMovements) {
      if (m.movementType === 'IN') totalInQty += m.quantity;
      else totalOutQty += m.quantity;
    }

    return sendSuccess({
      res,
      data: {
        kpis: {
          totalRevenue: {
            value: allConfirmedChallans._sum.grandTotal || 0,
            growthPercentage: parseFloat(revenueGrowthPct.toFixed(1)),
            label: 'Total Revenue',
            currency: 'INR',
          },
          totalCustomers: {
            value: totalCustomers,
            growth: customerGrowthCount,
            label: 'Total Customers',
          },
          pendingFollowUps: {
            value: pendingFollowUps,
            overdue: overdueFollowUps,
            label: 'Pending Follow-ups',
          },
          inventoryValuation: {
            value: inventoryValuation,
            catalogCount: allProducts.length,
            label: 'Inventory Value',
            currency: 'INR',
          },
          lowStockProducts: {
            value: lowStockCount,
            criticalCount: criticalStockCount,
            label: 'Low Stock Products',
          },
          challansThisMonth: {
            value: challansThisMonthCount,
            comparisonWithPrevMonth: challansThisMonthCount - prevMonthChallansCount,
            label: 'Challans This Month',
          },
        },
        charts: {
          salesTrend,
          customerDistribution,
          challanStatusBreakdown,
          topSellingProducts,
          stockMovementSummary: {
            totalInQty,
            totalOutQty,
            netChange: totalInQty - totalOutQty,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [
      lowStockProducts,
      overdueFollowUps,
      draftChallans,
      inactiveCustomers,
      recentActivities,
    ] = await Promise.all([
      // 1. Low stock products
      prisma.product.findMany({
        where: {
          currentStock: { lte: 15 }, // low stock threshold
        },
        take: 5,
        orderBy: { currentStock: 'asc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      // 2. Overdue follow-ups
      prisma.followUp.findMany({
        where: {
          status: 'PENDING',
          dueDate: { lt: startOfToday },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          customer: { select: { id: true, businessName: true, name: true, mobile: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      // 3. Draft challans pending confirmation
      prisma.salesChallan.findMany({
        where: { status: 'DRAFT' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      // 4. Inactive customers
      prisma.customer.findMany({
        where: { status: 'INACTIVE' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      // 5. Recent Important Activities
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      }),
    ]);

    const alerts = [];

    // Format Low Stock alerts
    for (const p of lowStockProducts) {
      alerts.push({
        id: `alert-stock-${p.id}`,
        type: 'LOW_STOCK',
        severity: p.currentStock === 0 ? 'CRITICAL' : 'WARNING',
        title: `${p.name} (${p.sku})`,
        message: `${p.currentStock === 0 ? 'Out of stock' : `Only ${p.currentStock} ${p.unit} remaining`} at ${p.warehouse.name} (Min: ${p.minStockQuantity})`,
        link: `/inventory?search=${encodeURIComponent(p.sku)}`,
        actionLabel: 'Restock / Adjust',
        timestamp: p.updatedAt,
      });
    }

    // Format Overdue Follow-up alerts
    for (const f of overdueFollowUps) {
      alerts.push({
        id: `alert-fu-${f.id}`,
        type: 'OVERDUE_FOLLOWUP',
        severity: f.priority === 'HIGH' ? 'CRITICAL' : 'WARNING',
        title: `Overdue: ${f.customer.businessName}`,
        message: `${f.reason} (Assigned to ${f.assignedTo.name})`,
        link: `/followups?customerId=${f.customer.id}`,
        actionLabel: 'View Follow-up',
        timestamp: f.dueDate,
      });
    }

    // Format Draft Challans
    for (const d of draftChallans) {
      alerts.push({
        id: `alert-draft-${d.id}`,
        type: 'DRAFT_CHALLAN',
        severity: 'INFO',
        title: `Draft Challan #${d.challanNumber}`,
        message: `Value: ₹${d.grandTotal.toLocaleString('en-IN')} for ${d.customer.businessName} — Pending stock reservation & confirmation`,
        link: `/challans/${d.id}`,
        actionLabel: 'Review & Confirm',
        timestamp: d.createdAt,
      });
    }

    return sendSuccess({
      res,
      data: {
        alerts,
        recentActivities,
        counts: {
          lowStock: lowStockProducts.length,
          overdueFollowUps: overdueFollowUps.length,
          draftChallans: draftChallans.length,
          inactiveCustomers: inactiveCustomers.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
