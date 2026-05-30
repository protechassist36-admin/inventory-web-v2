"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getTenantContext() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized: Tenant context not found");
  }
  return session.user.businessId;
}

export async function getCurrentSubscription() {
  const businessId = await getTenantContext();
  const prisma = getTenantPrisma(businessId);
  const subscription = await prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) return null;

  return {
    ...subscription,
    amount: subscription.amount.toNumber(),
    startDate: subscription.startDate.toISOString(),
    endDate: subscription.endDate.toISOString(),
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };
}

export async function getInvoices() {
  const businessId = await getTenantContext();
  const prisma = getTenantPrisma(businessId);
  const invoices = await prisma.invoice.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { payments: true },
  });

  return invoices.map(invoice => ({
    ...invoice,
    amount: invoice.amount.toNumber(),
    dueDate: invoice.dueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    payments: invoice.payments.map(payment => ({
      ...payment,
      amount: payment.amount.toNumber(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    }))
  }));
}

export async function createInvoice(data: { amount: number; dueDate: Date }) {
  const businessId = await getTenantContext();
  const prisma = getTenantPrisma(businessId);
  
  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      amount: data.amount,
      dueDate: data.dueDate,
      status: "UNPAID",
    },
  });
  
  revalidatePath("/dashboard/billing");
  
  return {
    ...invoice,
    amount: invoice.amount.toNumber(),
    dueDate: invoice.dueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

export async function recordPayment(invoiceId: string, data: { amount: number; paymentMethod: string; paymentRef?: string }) {
  const businessId = await getTenantContext();
  const prisma = getTenantPrisma(businessId);
  
  const payment = await prisma.payment.create({
    data: {
      businessId,
      invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentRef: data.paymentRef,
    },
  });

  // Check if invoice is fully paid
  const payments = await prisma.payment.findMany({ where: { invoiceId } });
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (invoice && totalPaid >= Number(invoice.amount)) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
  }

  revalidatePath("/dashboard/billing");
  
  return {
    ...payment,
    amount: payment.amount.toNumber(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
