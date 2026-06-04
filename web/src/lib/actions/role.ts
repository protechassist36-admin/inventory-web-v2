"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPermissions() {
  return await prisma.permission.findMany({
    orderBy: { key: "asc" }
  });
}

export async function createRole(data: { name: string; permissions: string[] }) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  return await prisma.role.create({
    data: {
      name: data.name,
      businessId: session.user.businessId,
      permissions: {
        connect: data.permissions.map(id => ({ id }))
      }
    }
  });
}

export async function updateRole(id: string, data: { name: string; permissions: string[] }) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  return await prisma.role.update({
    where: { id },
    data: {
      name: data.name,
      permissions: {
        set: data.permissions.map(id => ({ id }))
      }
    }
  });
}

export async function deleteRole(id: string) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  return await prisma.role.delete({
    where: { id }
  });
}
