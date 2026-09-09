import { Request } from 'express';
import { prisma } from '../config/db.js';

export interface AuditLogParams {
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  req?: Request;
}

export async function logAudit({
  userId,
  userName,
  action,
  entity,
  entityId,
  details,
  req,
}: AuditLogParams) {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'API Client';

    if (req) {
      ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      userAgent = req.headers['user-agent'] || 'API Client';
    }

    const detailsJson = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

    await prisma.auditLog.create({
      data: {
        userId: userId || (req as any)?.user?.userId || null,
        userName: userName || (req as any)?.user?.name || 'System',
        action,
        entity,
        entityId: entityId || null,
        detailsJson,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never crash the primary business operation
    console.error('⚠️ Failed to write audit log:', error);
  }
}
