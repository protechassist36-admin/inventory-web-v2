"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTables() {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const tables = await prisma.restaurantTable.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { name: "asc" },
  });

  return tables.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function createTable(data: { name: string; capacity: number }) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const table = await prisma.restaurantTable.create({
    data: {
      ...data,
      businessId: session.user.businessId,
    },
  });

  revalidatePath("/dashboard/restaurant/tables");
  return table;
}

export async function updateTable(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const table = await prisma.restaurantTable.update({
    where: { id, businessId: session.user.businessId },
    data,
  });

  revalidatePath("/dashboard/restaurant/tables");
  return table;
}

export async function deleteTable(id: string) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  await prisma.restaurantTable.delete({
    where: { id, businessId: session.user.businessId },
  });

  revalidatePath("/dashboard/restaurant/tables");
}
