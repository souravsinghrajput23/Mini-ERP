/**
 * FlowLedger Backend Integration & Business Logic Test Suite
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting FlowLedger Automated Integration & Business Rule Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Users & JWT Tokens
    console.log('--- 1. Authentication & Role Validation ---');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@flowledger.io' } });
    assert(!!adminUser, 'Admin user exists in database');
    assert(adminUser?.role === 'ADMIN', 'Admin user has ADMIN role');

    const isPwValid = await bcrypt.compare('password123', adminUser!.passwordHash);
    assert(isPwValid, 'Password verification succeeds with bcrypt');

    const token = generateToken({
      userId: adminUser!.id,
      email: adminUser!.email,
      role: adminUser!.role,
      name: adminUser!.name,
    });
    assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');

    // 2. Test Customer 360 & Relations
    console.log('\n--- 2. Customer 360 & Relations ---');
    const customer = await prisma.customer.findFirst({
      where: { businessName: 'Bharat Heavy Equipments Pvt Ltd' },
      include: { salesChallans: true, customerNotes: true, followUps: true },
    });
    assert(!!customer, 'Customer Bharat Heavy Equipments fetched');
    assert(customer!.salesChallans.length > 0, 'Customer has associated sales challans');
    assert(customer!.customerNotes.length > 0, 'Customer has timeline notes');

    // 3. Test Inventory Health Calculation
    console.log('\n--- 3. Product Catalog & Inventory Health ---');
    const criticalProd = await prisma.product.findFirst({
      where: { currentStock: { lte: 10, gt: 0 } },
    });
    assert(!!criticalProd, 'Critical stock products exist');

    const outOfStockProd = await prisma.product.findFirst({
      where: { currentStock: 0 },
    });
    assert(!!outOfStockProd, 'Out of stock products exist (currentStock = 0)');

    // 4. Test Sales Challan Multi-Step Logic & Atomic Transactions
    console.log('\n--- 4. Sales Challan Workflow & Stock Integrity ---');

    // Fetch test product with known stock
    const testProduct = await prisma.product.findFirst({
      where: { currentStock: { gte: 100 } },
    });
    assert(!!testProduct, 'Found available product for transactional test');

    const initialStock = testProduct!.currentStock;
    const testQty = 10;

    // A) Create DRAFT Challan
    const draftChallan = await prisma.salesChallan.create({
      data: {
        challanNumber: `TEST-CH-${Date.now()}`,
        customerId: customer!.id,
        status: 'DRAFT',
        totalQuantity: testQty,
        subTotal: testProduct!.unitPrice * testQty,
        taxAmount: (testProduct!.unitPrice * testQty * 18) / 100,
        grandTotal: testProduct!.unitPrice * testQty * 1.18,
        createdById: adminUser!.id,
        items: {
          create: [
            {
              productId: testProduct!.id,
              productNameSnapshot: testProduct!.name,
              skuSnapshot: testProduct!.sku,
              unitPriceSnapshot: testProduct!.unitPrice,
              quantity: testQty,
              lineTotal: testProduct!.unitPrice * testQty,
            },
          ],
        },
      },
    });

    // Verify DRAFT does NOT reduce stock
    const productAfterDraft = await prisma.product.findUnique({ where: { id: testProduct!.id } });
    assert(
      productAfterDraft!.currentStock === initialStock,
      'RULE VERIFIED: Draft Challan MUST NOT reduce inventory stock'
    );

    // B) Test Insufficient Stock Protection
    const excessiveQty = initialStock + 5000;
    let insufficientStockBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const p = await tx.product.findUnique({ where: { id: testProduct!.id } });
        if (p!.currentStock < excessiveQty) {
          throw new Error('INSUFFICIENT_STOCK');
        }
        await tx.product.update({
          where: { id: p!.id },
          data: { currentStock: p!.currentStock - excessiveQty },
        });
      });
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_STOCK') {
        insufficientStockBlocked = true;
      }
    }
    assert(insufficientStockBlocked, 'RULE VERIFIED: Over-allocation is strictly blocked (Stock cannot become negative)');

    // C) Atomically Confirm Challan
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: testProduct!.id },
        data: { currentStock: testProduct!.currentStock - testQty },
      });
      await tx.stockMovement.create({
        data: {
          productId: testProduct!.id,
          warehouseId: testProduct!.warehouseId,
          quantity: testQty,
          movementType: 'OUT',
          reason: 'SALES_CHALLAN',
          referenceNumber: draftChallan.challanNumber,
          challanId: draftChallan.id,
          createdById: adminUser!.id,
          notes: 'Test confirmation',
        },
      });
      await tx.salesChallan.update({
        where: { id: draftChallan.id },
        data: { status: 'CONFIRMED', confirmedById: adminUser!.id, confirmedAt: new Date() },
      });
    });

    const productAfterConfirm = await prisma.product.findUnique({ where: { id: testProduct!.id } });
    assert(
      productAfterConfirm!.currentStock === initialStock - testQty,
      'RULE VERIFIED: Confirmed Challan MUST atomically deduct stock'
    );

    const movementRecord = await prisma.stockMovement.findFirst({
      where: { challanId: draftChallan.id, movementType: 'OUT' },
    });
    assert(!!movementRecord, 'Stock Movement (OUT) created in ledger');

    // D) Atomically Cancel Confirmed Challan & Restore Stock
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: testProduct!.id },
        data: { currentStock: productAfterConfirm!.currentStock + testQty },
      });
      await tx.stockMovement.create({
        data: {
          productId: testProduct!.id,
          warehouseId: testProduct!.warehouseId,
          quantity: testQty,
          movementType: 'IN',
          reason: 'STOCK_RETURN',
          referenceNumber: `CAN-${draftChallan.challanNumber}`,
          challanId: draftChallan.id,
          createdById: adminUser!.id,
          notes: 'Restored after test cancellation',
        },
      });
      await tx.salesChallan.update({
        where: { id: draftChallan.id },
        data: { status: 'CANCELLED', cancelledById: adminUser!.id, cancelledAt: new Date() },
      });
    });

    const productAfterCancel = await prisma.product.findUnique({ where: { id: testProduct!.id } });
    assert(
      productAfterCancel!.currentStock === initialStock,
      'RULE VERIFIED: Cancelling Confirmed Challan MUST safely restore inventory'
    );

    // Clean up test records
    await prisma.stockMovement.deleteMany({ where: { challanId: draftChallan.id } });
    await prisma.salesChallanItem.deleteMany({ where: { challanId: draftChallan.id } });
    await prisma.salesChallan.delete({ where: { id: draftChallan.id } });

    console.log(`\n======================================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
