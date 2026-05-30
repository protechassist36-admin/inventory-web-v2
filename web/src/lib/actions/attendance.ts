"use server";

import { prisma as globalPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";

/**
 * DIRECT NEURAL BRIDGE (Raw SQL)
 * This bypasses the Prisma Client property cache which is currently lagging behind the database schema.
 */

export async function getAttendanceLogs() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    // Bypassing Prisma Model Cache via Raw SQL Join
    const logs: any = await globalPrisma.$queryRawUnsafe(`
      SELECT 
        a.id, 
        u.name as "userName", 
        u.email as "userEmail", 
        a."clockIn", 
        a."clockOut", 
        a.status, 
        a.note
      FROM "Attendance" a
      LEFT JOIN "User" u ON a."userId" = u.id
      WHERE a."businessId" = $1 AND a."deletedAt" IS NULL
      ORDER BY a."clockIn" DESC
      LIMIT 100
    `, businessId);

    return logs.map((l: any) => ({
      id: l.id,
      userName: l.userName || "Unknown",
      userEmail: l.userEmail,
      clockIn: new Date(l.clockIn).toISOString(),
      clockOut: l.clockOut ? new Date(l.clockOut).toISOString() : null,
      status: l.status,
      note: l.note
    }));
  } catch (error: any) {
    console.error("ATTENDANCE BRIDGE ERROR (Logs):", error);
    throw new Error(`Attendance bridge failed: ${error.message}`);
  }
}

export async function clockIn(userId: string, note?: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    // 1. Check for active session using raw SQL
    const existing: any = await globalPrisma.$queryRawUnsafe(`
      SELECT id FROM "Attendance" 
      WHERE "userId" = $1 AND "businessId" = $2 AND "clockOut" IS NULL AND "deletedAt" IS NULL
      LIMIT 1
    `, userId, businessId);

    if (existing && existing.length > 0) {
      throw new Error("Personnel node already active in current cycle.");
    }

    // 2. Initialize new node
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await globalPrisma.$executeRawUnsafe(`
      INSERT INTO "Attendance" (id, "userId", "businessId", "clockIn", status, note, "updatedAt", "createdAt")
      VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), NOW())
    `, id, userId, businessId, "ON_TIME", note || "General Duty");

    revalidatePath("/dashboard/staff/attendance");
    return { success: true, id };
  } catch (error: any) {
    console.error("ATTENDANCE BRIDGE ERROR (Clock-In):", error);
    throw error;
  }
}

export async function clockOut(logId: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    // 3. Terminate cycle using raw SQL
    await globalPrisma.$executeRawUnsafe(`
      UPDATE "Attendance" 
      SET "clockOut" = NOW(), "updatedAt" = NOW()
      WHERE id = $1 AND "businessId" = $2
    `, logId, businessId);

    revalidatePath("/dashboard/staff/attendance");
    return { success: true };
  } catch (error: any) {
    console.error("ATTENDANCE BRIDGE ERROR (Clock-Out):", error);
    throw error;
  }
}
