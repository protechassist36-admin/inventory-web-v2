"use server";

import { prisma } from "@/lib/prisma";

export async function getPermissions() {
  return await prisma.permission.findMany({
    orderBy: { key: "asc" }
  });
}
