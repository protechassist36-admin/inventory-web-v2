"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    // Use raw SQL for newly added model resilience
    const notifications: any = await globalPrisma.$queryRawUnsafe(`
      SELECT * FROM "Notification"
      WHERE "businessId" = $1 AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, businessId);

    return notifications.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt).toISOString(),
    }));
  } catch (error: any) {
    console.error("NOTIFICATION ERROR (getNotifications):", error);
    throw new Error(`Failed to sync alert stream: ${error.message}`);
  }
}

export async function markAsRead(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    await globalPrisma.$executeRawUnsafe(`
      UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW()
      WHERE id = $1 AND "businessId" = $2
    `, id, session.user.businessId);

    revalidatePath("/dashboard/system/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark alert as read:", error);
    throw error;
  }
}

export async function markAllAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    await globalPrisma.$executeRawUnsafe(`
      UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW()
      WHERE "businessId" = $1 AND "isRead" = false
    `, session.user.businessId);

    revalidatePath("/dashboard/system/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all alerts as read:", error);
    throw error;
  }
}

export async function createNotification(data: { title: string; message: string; type?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) return;

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await globalPrisma.$executeRawUnsafe(`
      INSERT INTO "Notification" (id, title, message, type, "isRead", "businessId", "updatedAt", "createdAt")
      VALUES ($1, $2, $3, $4, false, $5, NOW(), NOW())
    `, id, data.title, data.message, data.type || "INFO", session.user.businessId);

    revalidatePath("/dashboard/system/notifications");
  } catch (error) {
    console.error("Failed to create alert node:", error);
  }
}

export async function deleteNotification(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    await globalPrisma.$executeRawUnsafe(`
      UPDATE "Notification" SET "deletedAt" = NOW()
      WHERE id = $1 AND "businessId" = $2
    `, id, session.user.businessId);

    revalidatePath("/dashboard/system/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to purge alert node:", error);
    throw error;
  }
}
