"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";

export async function createSale(data: {
  items: { productId: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  customerId?: string;
  amountPaid?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const userId = session.user.id;
    const prisma = getTenantPrisma(businessId);

    // Use a transaction to ensure both sale and stock update succeed or fail together
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create the Sale record
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus || "PAID",
          customerId: data.customerId,
          businessId: businessId,
          userId: userId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      // 2. Handle Debt if not fully paid
      if (data.paymentStatus === "UNPAID" || data.paymentStatus === "PARTIAL") {
        if (!data.customerId) throw new Error("Customer required for credit sales");
        
        await tx.debt.create({
          data: {
            customerId: data.customerId,
            saleId: newSale.id,
            totalAmount: data.totalAmount,
            paidAmount: data.amountPaid || 0,
            status: data.paymentStatus === "UNPAID" ? "PENDING" : "PARTIAL",
            businessId: businessId,
          },
        });
      }

      // 3. Update Stock Levels and record Stock Movements
      for (const item of data.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        // 4. CHECK FOR LOW STOCK
        if (product.stockQuantity <= product.minStockLevel) {
           await createNotification({
              title: "Low Stock Alert",
              message: `Product "${product.name}" has reached its threshold. Remaining: ${product.stockQuantity}`,
              type: "WARNING"
           });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "OUT",
            reason: `Sale ${newSale.invoiceNumber}`,
            businessId: businessId,
            userId: userId,
          },
        });
      }

      return newSale;
    });

    // Revalidate relevant paths to update dashboard and inventory UI
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory/products");
    
    // Return a plain object to avoid Decimal serialization issues
    return { 
      success: true, 
      saleId: sale.id,
      totalAmount: sale.totalAmount.toNumber(),
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt.toISOString()
    };
  } catch (error) {
    console.error("CRITICAL ERROR: Sale processing failed:", error);
    throw error;
  }
}

export async function getRecentSales() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Serialize Decimal and Dates for Client Components - Explicitly map all fields
    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      totalAmount: s.totalAmount.toNumber(),
      discount: s.discount.toNumber(),
      tax: s.tax.toNumber(),
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      status: s.status,
      businessId: s.businessId,
      userId: s.userId,
      customerId: s.customerId,
      tableId: s.tableId,
      createdAt: s.createdAt.toISOString(),
      items: s.items.map(item => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        total: item.total.toNumber(),
        status: item.status,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          unitPrice: item.product.unitPrice.toNumber(),
        } : null
      }))
    }));
  } catch (error) {
    console.error("Failed to fetch recent sales:", error);
    throw error;
  }
}

export async function getSales() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        user: true
      }
    });

    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      totalAmount: s.totalAmount.toNumber(),
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name || "Walk-in Customer",
      userName: s.user?.name || "System",
      items: s.items.map(item => ({
        id: item.id,
        name: item.product?.name || "Unknown",
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        total: item.total.toNumber()
      }))
    }));
  } catch (error) {
    console.error("Failed to fetch sales history:", error);
    throw error;
  }
}

export async function getSalesByRange(start: Date, end: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const sales = await prisma.sale.findMany({
      where: { 
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return sales.map(s => ({
      totalAmount: s.totalAmount.toNumber(),
      createdAt: s.createdAt.toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch sales range:", error);
    throw error;
  }
}
