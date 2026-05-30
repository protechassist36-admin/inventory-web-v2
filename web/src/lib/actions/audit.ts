"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function logAudit(data: {
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) return; // Don't throw, just ignore if not authenticated

    const prisma = getTenantPrisma(session.user.businessId);

    await prisma.auditLog.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

export async function getAuditLogs() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      take: 100,
    });

    return logs.map(l => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      oldData: l.oldData,
      newData: l.newData,
      createdAt: l.createdAt.toISOString(),
      userName: l.user?.name || "System",
      userEmail: l.user?.email || "N/A"
    }));
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
}
