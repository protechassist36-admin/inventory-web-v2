"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDebts() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const debts = await prisma.debt.findMany({
      where: { businessId: session.user.businessId },
      include: {
        customer: true,
        sale: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return debts.map(d => ({
      ...d,
      totalAmount: d.totalAmount.toNumber(),
      paidAmount: d.paidAmount.toNumber(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      dueDate: d.dueDate?.toISOString() || null,
      sale: d.sale ? {
        ...d.sale,
        totalAmount: d.sale.totalAmount.toNumber(),
        discount: d.sale.discount.toNumber(),
        tax: d.sale.tax.toNumber(),
        createdAt: d.sale.createdAt.toISOString(),
        updatedAt: d.sale.updatedAt.toISOString(),
        deletedAt: d.sale.deletedAt?.toISOString() || null,
      } : null,
      payments: d.payments.map(p => ({
        ...p,
        amount: p.amount.toNumber(),
        createdAt: p.createdAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch debts:", error);
    throw error;
  }
}

export async function createDebtPayment(debtId: string, amount: number, paymentMethod: string = "CASH") {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const businessId = session.user.businessId;

    const payment = await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUnique({
        where: { id: debtId, businessId: businessId },
      });

      if (!debt) throw new Error("Debt not found");

      const newPayment = await tx.debtPayment.create({
        data: {
          debtId,
          amount,
          paymentMethod,
          businessId,
        },
      });

      const updatedPaidAmount = debt.paidAmount.toNumber() + amount;
      const newStatus = updatedPaidAmount >= debt.totalAmount.toNumber() ? "PAID" : "PARTIAL";

      await tx.debt.update({
        where: { id: debtId },
        data: {
          paidAmount: updatedPaidAmount,
          status: newStatus,
        },
      });

      return newPayment;
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/reports");
    
    return { 
      success: true, 
      paymentId: payment.id,
      amount: payment.amount.toNumber(),
      createdAt: payment.createdAt.toISOString()
    };
  } catch (error) {
    console.error("Failed to process debt payment:", error);
    throw error;
  }
}
