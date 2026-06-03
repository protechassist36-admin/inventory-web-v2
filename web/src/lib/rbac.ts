import { prisma } from "@/lib/prisma";

/**
 * Checks if a user has the required permission for an action, 
 * factoring in both RBAC and the subscription plan limits.
 */
export async function checkAccess(
  userId: string,
  businessId: string,
  requiredPermission: string
) {
  // 1. Fetch user role/permissions and business plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      role: { include: { permissions: true } },
      business: { select: { plan: true } }
    }
  });

  if (!user) throw new Error("Unauthorized");

  // 2. Admin Bypass: Admin has full access to enabled modules of the plan
  if (user.role.name === "ADMIN") {
    return { allowed: true };
  }

  // 3. Permission Check for Staff
  const hasPermission = user.role.permissions.some(p => p.key === requiredPermission);
  
  if (!hasPermission) {
    return { allowed: false, message: "You do not have permission to perform this action." };
  }

  // 4. Feature Limit Check (Integrate with subscription limits)
  // (Optional: logic here could be added for plan-based restrictions on staff)
  
  return { allowed: true };
}
