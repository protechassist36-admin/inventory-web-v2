"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/actions/product";
import { getCategories } from "@/lib/actions/category";
import { toast } from "sonner";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      toast.success("Back online. Syncing data...");
      syncPendingSales();
    }
    function handleOffline() {
      setIsOnline(false);
      toast.warning("You are offline. Data will be saved locally.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync of products and categories to IndexedDB
    if (isOnline) {
      initialSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]);

  async function initialSync() {
    try {
      setIsSyncing(true);
      const [products, categories] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      // Update IndexedDB
      await db.products.clear();
      await db.products.bulkAdd(products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitPrice: parseFloat(p.unitPrice),
        stockQuantity: p.stockQuantity,
        categoryId: p.categoryId,
        metadata: p.metadata,
      })));

      await db.categories.clear();
      await db.categories.bulkAdd(categories.map((c: any) => ({
        id: c.id,
        name: c.name,
      })));

      console.log("Initial sync complete");
    } catch (error) {
      console.error("Initial sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncPendingSales() {
    try {
      setIsSyncing(true);
      const pendingSales = await db.pendingSales.where("synced").equals(0).toArray();
      
      if (pendingSales.length === 0) return;

      // In a real app, you'd loop through and POST to /api/sales
      // For now, we'll simulate it
      for (const sale of pendingSales) {
        // await fetch('/api/sales', { method: 'POST', body: JSON.stringify(sale) });
        await db.pendingSales.update(sale.id!, { synced: true });
      }

      toast.success(`${pendingSales.length} sales synced to cloud`);
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  }

  return { isOnline, isSyncing, initialSync };
}
