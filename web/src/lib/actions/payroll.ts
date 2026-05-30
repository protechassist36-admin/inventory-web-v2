"use server";

import { prisma as globalPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getPayrolls() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    // Use raw SQL or dynamic access for newly added model resilience
    const payrolls: any = await globalPrisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        u.name as "userName",
        u.email as "userEmail",
        p.amount,
        p.status,
        p."periodStart",
        p."periodEnd",
        p."paymentDate",
        p."paymentMethod"
      FROM "Payroll" p
      LEFT JOIN "User" u ON p."userId" = u.id
      WHERE p."businessId" = $1 AND p."deletedAt" IS NULL
      ORDER BY p."createdAt" DESC
    `, businessId);

    return payrolls.map((p: any) => ({
      ...p,
      amount: parseFloat(p.amount),
      periodStart: new Date(p.periodStart).toISOString(),
      periodEnd: new Date(p.periodEnd).toISOString(),
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : null
    }));
  } catch (error: any) {
    console.error("PAYROLL ERROR (getPayrolls):", error);
    throw new Error(`Payroll fetch failed: ${error.message}`);
  }
}

export async function processPayroll(userId: string, amount: number, periodStart: Date, periodEnd: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await globalPrisma.$executeRawUnsafe(`
      INSERT INTO "Payroll" (id, "userId", "businessId", amount, status, "periodStart", "periodEnd", "updatedAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, id, userId, businessId, amount, "PENDING", periodStart, periodEnd);

    revalidatePath("/dashboard/staff/payroll");
    return { success: true, id };
  } catch (error: any) {
    console.error("PAYROLL ERROR (processPayroll):", error);
    throw error;
  }
}

export async function markAsPaid(payrollId: string, method: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    await globalPrisma.$executeRawUnsafe(`
      UPDATE "Payroll" 
      SET status = 'PAID', "paymentDate" = NOW(), "paymentMethod" = $1, "updatedAt" = NOW()
      WHERE id = $2 AND "businessId" = $3
    `, method, payrollId, businessId);

    revalidatePath("/dashboard/staff/payroll");
    return { success: true };
  } catch (error: any) {
    console.error("PAYROLL ERROR (markAsPaid):", error);
    throw error;
  }
}
