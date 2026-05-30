"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

async function checkSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Super Admin access required");
  }
}

export async function getAllBusinesses() {
  await checkSuperAdmin();
  const businesses = await prisma.business.findMany({
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          sales: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return businesses.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    trialStartDate: b.trialStartDate?.toISOString() || null,
    trialEndDate: b.trialEndDate?.toISOString() || null,
  }));
}

export async function updateBusinessPlan(businessId: string, plan: any) {
  await checkSuperAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { plan },
  });
  revalidatePath("/super-admin/businesses");
}

export async function approveBusiness(businessId: string) {
  await checkSuperAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/super-admin/businesses");
}

export async function deleteBusiness(businessId: string) {
  await checkSuperAdmin();
  try {
    // Prisma onDelete: Cascade should handle related models if configured correctly in schema
    await prisma.business.delete({
      where: { id: businessId },
    });
    revalidatePath("/super-admin/businesses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete business:", error);
    throw new Error("Failed to delete business. Ensure all dependencies are handled.");
  }
}

export async function startImpersonation(businessId: string) {
  await checkSuperAdmin();
  
  const admin = await prisma.user.findFirst({
    where: { 
      businessId, 
      role: { name: 'ADMIN' } 
    },
  });

  if (!admin) {
    throw new Error("No admin user found for this business.");
  }

  // Set a secure cookie for impersonation
  (await cookies()).set("impersonation_target", admin.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { email: admin.email };
}

export async function stopImpersonation() {
  await checkSuperAdmin();
  (await cookies()).delete("impersonation_target");
  revalidatePath("/super-admin/businesses");
}

export async function resetTenantAdminPassword(businessId: string) {
  await checkSuperAdmin();
  
  const admin = await prisma.user.findFirst({
    where: { 
      businessId, 
      role: { name: 'ADMIN' } 
    },
  });

  if (!admin) {
    throw new Error("No admin user found for this business.");
  }

  // Generate a secure temporary password
  const newPassword = Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 1000);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: hashedPassword },
  });

  return { email: admin.email, newPassword };
}

export async function getAuditLogs() {
  await checkSuperAdmin();
  
  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
      business: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getSystemStats() {
  await checkSuperAdmin();
  const [businessCount, userCount, totalSales, activeSubscriptions] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.sale.aggregate({
      _sum: { totalAmount: true }
    }),
    prisma.subscription.count({
        where: { status: 'active' }
    })
  ]);

  return {
    businessCount,
    userCount,
    revenue: Number(totalSales._sum.totalAmount) || 0,
    activeSubscriptions
  };
}
