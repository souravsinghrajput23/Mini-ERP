import { prisma } from '../config/db.js';

/**
 * Generates a strictly unique, sequential Challan number in the format: SC-YYYY-0001
 */
export async function generateChallanNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SC-${currentYear}-`;

  // Find the latest challan created this year
  const latestChallan = await prisma.salesChallan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      challanNumber: 'desc',
    },
    select: {
      challanNumber: true,
    },
  });

  if (!latestChallan) {
    return `${prefix}0001`;
  }

  const parts = latestChallan.challanNumber.split('-');
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
