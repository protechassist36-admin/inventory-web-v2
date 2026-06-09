"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";

export async function createSale(data: {
  items: { 
    productId?: string; 
    productName?: string; 
    quantity: number; 
    unitId?: string; // Add unitId
    ratio?: number; // Add ratio
    unitPrice: number; 
    total: number;
    isExternalSourced?: boolean;
    externalSourceName?: string;
    externalCostPrice?: number;
  }[];
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

    // Use a transaction to ensure sale, stock update, and expenses succeed together
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create the Sale record
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus || "PAID",
          status: "PENDING", // Initial status
          customerId: data.customerId,
          businessId: businessId,
          userId: userId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId || null,
              productName: item.productName || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              isExternalSourced: item.isExternalSourced || false,
              externalSourceName: item.externalSourceName || null,
              externalCostPrice: item.externalCostPrice || null,
              businessId: businessId,
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: "Order created",
              userId: userId,
              businessId: businessId,
            }
          }
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
        if (item.isExternalSourced) {
          // 3a. Create automatic expense for external sourcing
          await tx.expense.create({
            data: {
              description: `External Sourcing: ${item.productName} (Sale ${newSale.invoiceNumber})`,
              amount: (item.externalCostPrice || 0) * item.quantity,
              category: "COGS",
              date: new Date(),
              paymentMethod: "CASH",
              businessId: businessId,
              userId: userId,
            }
          });
          continue; // Skip stock updates for external items
        }

        if (!item.productId) continue;

        // Apply conversion ratio
        const deductionQuantity = item.quantity * (item.ratio || 1);

        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: deductionQuantity,
            },
          },
        });

        // 4. CHECK FOR LOW STOCK
        if (product.stockQuantity === 0) {
           await createNotification({
              title: `Critical Low Stock: ${product.name}`,
              message: `Product "${product.name}" is completely out of stock.`,
              type: "CRITICAL"
           });
        } else if (product.stockQuantity <= product.minStockLevel) {
           await createNotification({
              title: `Low Stock: ${product.name}`,
              message: `Product "${product.name}" has reached its threshold. Remaining: ${product.stockQuantity}`,
              type: "WARNING"
           });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: deductionQuantity,
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
      totalAmount: typeof s.totalAmount === 'number' ? s.totalAmount : (s.totalAmount as any).toNumber?.() || Number(s.totalAmount) || 0,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name || "Walk-in Customer",
      userName: s.user?.name || "System",
      items: s.items.map(item => ({
        id: item.id,
        name: item.productName || item.product?.name || "Unknown",
        quantity: item.quantity,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : (item.unitPrice as any).toNumber?.() || Number(item.unitPrice) || 0,
        total: typeof item.total === 'number' ? item.total : (item.total as any).toNumber?.() || Number(item.total) || 0
      }))
    }));
    } catch (error: any) {
    console.error("SALES FETCH ERROR:", error);
    throw new Error(`Sales Node Sync Failed: ${error.message}`);
    }
    }

    export async function getOrderStatusHistory(saleId: string) {
    try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    // Use global prisma to ensure access to all models including history
    const history = await globalPrisma.orderStatusHistory.findMany({
      where: { saleId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } }
    });

    return history.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
      userName: h.user?.name || "System"
    }));
    } catch (error) {
    console.error("Failed to fetch order status history:", error);
    throw error;
    }
    }

export async function getSalesHistoryByRange(start: Date, end: Date) {
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
      totalAmount: typeof s.totalAmount === 'number' ? s.totalAmount : (s.totalAmount as any).toNumber?.() || Number(s.totalAmount) || 0,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name || "Walk-in Customer",
      userName: s.user?.name || "System",
      items: s.items.map(item => ({
        id: item.id,
        name: item.productName || item.product?.name || "Unknown",
        quantity: item.quantity,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : (item.unitPrice as any).toNumber?.() || Number(item.unitPrice) || 0,
        total: typeof item.total === 'number' ? item.total : (item.total as any).toNumber?.() || Number(item.total) || 0
      }))
    }));
    } catch (error: any) {
    console.error("SALES FETCH ERROR:", error);
    throw new Error(`Sales Node Sync Failed: ${error.message}`);
    }
}

export async function updateSaleStatus(saleId: string, status: string, note?: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const userId = session.user.id;
    const prisma = getTenantPrisma(businessId);

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: status.toUpperCase(),
        statusHistory: {
          create: {
            status: status.toUpperCase(),
            note: note || `Status updated to ${status}`,
            userId: userId,
            businessId: businessId
          }
        }
      }
    });

    revalidatePath("/dashboard/sales/orders");
    return { success: true, status: updatedSale.status };
  } catch (error: any) {
    console.error("Failed to update sale status:", error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}
