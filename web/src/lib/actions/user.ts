"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/mail";
import { canPerformAction } from "@/lib/subscriptions";
import { logAudit } from "./audit";

export async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) {
      console.log("USER DEBUG: No businessId in session", session?.user);
      throw new Error("Unauthorized: No business context detected.");
    }

    const businessId = session.user.businessId;
    
    // Using globalPrisma directly to ensure latest model detection
    const users = await globalPrisma.user.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: {
        role: true
      }
    });

    return users.map(u => ({
      ...u,
      salary: u.salary?.toNumber() || null,
      hourlyRate: u.hourlyRate?.toNumber() || null,
      roleName: u.role?.name || "No Role",
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      deletedAt: u.deletedAt?.toISOString() || null,
    }));
  } catch (error: any) {
    console.error("USER ERROR (getUsers):", error);
    throw new Error(`Failed to fetch user nodes: ${error.message}`);
  }
}

export async function getRoles() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    return await prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    throw error;
  }
}

export async function createUser(data: { name: string; email: string; password: string; roleId: string; selectedPermissions: string[] }) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const prisma = getTenantPrisma(businessId);

    // 1. Check Plan Limits
    const business = await globalPrisma.business.findUnique({
      where: { id: businessId },
      select: { 
        plan: true, 
        _count: { 
          select: { 
            users: { where: { deletedAt: null } } 
          } 
        } 
      }
    });

    const userCount = business?._count.users || 0;
    const plan = business?.plan || "FREE";

    const check = canPerformAction(plan, "maxStaff", userCount);
    if (!check.allowed) {
      throw new Error(check.message);
    }

    // 2. Hash Password and create User
    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = generateVerificationToken();

    // 3. Update Role permissions based on selection
    await prisma.role.update({
      where: { id: data.roleId },
      data: {
        permissions: {
          set: data.selectedPermissions.map(id => ({ id }))
        }
      }
    });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        roleId: data.roleId,
        businessId: businessId,
        verificationToken,
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "USER",
      entityId: user.id,
      newData: { name: user.name, email: user.email, roleId: user.roleId }
    });

    await sendVerificationEmail(data.email, verificationToken);

    revalidatePath("/dashboard/staff/employees");
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}

export async function changePassword(data: { current: string; new: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await globalPrisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(data.current, user.passwordHash);
    if (!isMatch) throw new Error("Current password incorrect");

    const newHash = await bcrypt.hash(data.new, 10);

    await globalPrisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Password change failed:", error);
    throw error;
  }
}

export async function updateUser(id: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const prisma = getTenantPrisma(session.user.businessId);

    const user = await prisma.user.update({
      where: { id, businessId: session.user.businessId },
      data,
    });

    await logAudit({
      action: "UPDATE",
      entity: "USER",
      entityId: user.id,
      newData: data
    });

    revalidatePath("/dashboard/settings");
    return {
      ...user,
      salary: user.salary?.toNumber() || null,
      hourlyRate: user.hourlyRate?.toNumber() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString() || null,
    };
  } catch (error) {
    console.error("Failed to update user:", error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deletion
    if (session.user.id === id) throw new Error("You cannot delete your own admin account");

    const prisma = getTenantPrisma(session.user.businessId);

    await prisma.user.delete({
      where: { id, businessId: session.user.businessId },
    });

    await logAudit({
      action: "DELETE",
      entity: "USER",
      entityId: id,
    });

    revalidatePath("/dashboard/settings");
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw error;
  }
}
