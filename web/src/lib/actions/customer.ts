"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const customers = await prisma.customer.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
    });

    return customers.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
}

export async function createCustomer(data: { name: string; email?: string; phone?: string; address?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const customer = await prisma.customer.create({
      data: {
        ...data,
        businessId: session.user.businessId,
      },
    });

    revalidatePath("/dashboard/customers");
    return {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw error;
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const customer = await prisma.customer.update({
      where: { id, businessId: session.user.businessId },
      data,
    });

    revalidatePath("/dashboard/customers");
    return {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to update customer:", error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    await prisma.customer.delete({
      where: { id, businessId: session.user.businessId },
    });

    revalidatePath("/dashboard/customers");
  } catch (error) {
    console.error("Failed to delete customer:", error);
    throw error;
  }
}
