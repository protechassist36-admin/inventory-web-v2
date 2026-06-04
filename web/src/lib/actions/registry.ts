"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getRegistryIntelligence() {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const businessId = session.user.businessId;

  const [customers] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId, deletedAt: null },
      include: {
        sales: {
          include: {
            items: { include: { product: { include: { category: true } } } }
          },
          orderBy: { createdAt: "desc" }
        },
      }
    }),
  ]);

  const now = new Date();
  
  const registryNodes = customers.map(c => {
    const totalVolume = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const lastInteraction = c.sales.length > 0 ? c.sales[0].createdAt : c.createdAt;
    const daysSinceLastPurchase = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    
    // Affinity Logic
    const categoryCounts: Record<string, number> = {};
    c.sales.forEach(s => s.items.forEach(item => {
        const cat = item.product?.category?.name || "Uncategorized";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
    }));
    const primaryAffinity = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Cluster Status
    let status = "Dormant";
    if (c.sales.length > 5 && daysSinceLastPurchase < 30) status = "High Velocity";
    else if (c.sales.length > 0 && daysSinceLastPurchase > 60) status = "At Risk";

    return {
        id: c.id,
        name: c.name,
        totalVolume,
        lastInteraction,
        daysSinceLastPurchase,
        primaryAffinity,
        status
    };
  });

  const clusterCounts = registryNodes.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
  }, { "High Velocity": 0, "Dormant": 0, "At Risk": 0 } as Record<string, number>);

  return {
    nodes: registryNodes,
    clusterCounts
  };
}
