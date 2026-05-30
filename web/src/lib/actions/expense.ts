"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createExpense(data: {
  description: string;
  amount: number;
  category: string;
  date?: Date;
  paymentMethod?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const prisma = getTenantPrisma(businessId);

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date || new Date(),
        paymentMethod: data.paymentMethod || "CASH",
        businessId: businessId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/accounting/expenses");
    revalidatePath("/dashboard");
    
    return { success: true, id: expense.id };
  } catch (error) {
    console.error("Failed to create expense:", error);
    throw error;
  }
}

export async function getExpenses() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: {
        user: true
      }
    });

    return expenses.map(e => ({
      ...e,
      amount: e.amount.toNumber(),
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      userName: e.user?.name || "System",
      user: e.user ? {
        ...e.user,
        salary: e.user.salary?.toNumber() || null,
        hourlyRate: e.user.hourlyRate?.toNumber() || null,
        createdAt: e.user.createdAt.toISOString(),
        updatedAt: e.user.updatedAt.toISOString(),
        deletedAt: e.user.deletedAt?.toISOString() || null,
      } : null
    }));
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    throw error;
  }
}

export async function getExpensesByRange(start: Date, end: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const expenses = await prisma.expense.findMany({
      where: { 
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: "asc" }
    });

    return expenses.map(e => ({
      amount: e.amount.toNumber(),
      date: e.date.toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch expense range:", error);
    throw error;
  }
}
