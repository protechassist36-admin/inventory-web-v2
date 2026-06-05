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

export async function createUser(data: { name: string; email: string; password: string; roleId: string }) {
  try {
    console.log("DEBUG: createUser called with:", { name: data.name, email: data.email, roleId: data.roleId });
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const prisma = getTenantPrisma(businessId);
    console.log("DEBUG: Tenant Prisma initialized for business:", businessId);

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
    console.log("DEBUG: Plan check:", { plan, userCount });

    const check = canPerformAction(plan, "maxStaff", userCount);
    if (!check.allowed) {
      console.error("DEBUG: Plan limit reached:", check.message);
      throw new Error(check.message);
    }

    // 2. Hash Password and create User
    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = generateVerificationToken();

    // 3. Find/Create the 'Employee' role and ensure permissions
    console.log("DEBUG: Searching for Employee role...");
    let employeeRole = await prisma.role.findFirst({
        where: { businessId: businessId, name: "Employee" }
    });

    const restrictedPermissions = [
        "menu:overview", // Dashboard Overview
        "menu:inventory", // Inventory (Base)
        "menu:inventory:products", // Products
        "menu:inventory:history", // Stock History
        "menu:inventory:expiry", // Expiry Tracking
        "menu:sales", // Commerce (Sales Base)
        "menu:sales:pos", // Launch POS
        "menu:sales:history", // Sales History
        "menu:sales:returns", // Returns
        "menu:customers", // Relationships
        "menu:customers:registry", // Customer Registry
        "menu:customers:loyalty", // Loyalty Program
        "menu:staff:attendance", // Attendance
        "menu:system:notifications", // Notifications
        "menu:support:manual" // System Manual
    ];
    
    // Find permission IDs for these keys
    const allPermissions = await prisma.permission.findMany();
    console.log("DEBUG: All available permissions:", allPermissions.map(p => p.key));
    
    const permissions = await prisma.permission.findMany({
        where: { key: { in: restrictedPermissions } }
    });
    console.log("DEBUG: Found permissions:", permissions.length);

    if (!employeeRole) {
        console.log("DEBUG: Employee role not found, creating it...");
        employeeRole = await prisma.role.create({
            data: {
                name: "Employee",
                businessId: businessId,
                permissions: {
                    connect: permissions.map(p => ({ id: p.id }))
                }
            }
        });
        console.log("DEBUG: Employee role created:", employeeRole.id);
    } else {
        console.log("DEBUG: Updating existing Employee role:", employeeRole.id);
        // Update permissions for existing Employee role
        await prisma.role.update({
            where: { id: employeeRole.id },
            data: {
                permissions: {
                    set: permissions.map(p => ({ id: p.id }))
                }
            }
        });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        roleId: employeeRole.id,
        businessId: businessId,
        verificationToken,
      },
    });
    console.log("DEBUG: User created:", user.id);

    await logAudit({
      action: "CREATE",
      entity: "USER",
      entityId: user.id,
      newData: { name: user.name, email: user.email, roleId: employeeRole.id }
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
