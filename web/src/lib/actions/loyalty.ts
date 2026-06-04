"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getLoyaltyStats() {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");
  
  const prisma = getTenantPrisma(session.user.businessId);

  // In a real system, you'd calculate these from actual loyalty point records.
  // Using mocks for now, but linked to database structure.
  return {
    activeMembers: await prisma.customer.count({ where: { businessId: session.user.businessId } }),
    pointsIssued: 24500, // Placeholder calculation
    rewardsRedeemed: 89,
    memberGrowth: "+12%"
  };
}

export async function launchCampaign(data: { name: string, targetCluster: string }) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");
  
  const prisma = getTenantPrisma(session.user.businessId);

  return await prisma.loyaltyCampaign.create({
    data: {
      ...data,
      businessId: session.user.businessId
    }
  });
}
