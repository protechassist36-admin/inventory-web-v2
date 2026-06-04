"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getNotifications, markAsRead } from "@/lib/actions/notification";
import { syncLowStockNotifications } from "@/lib/actions/stock-check";
import { useSession } from "next-auth/react";
import { AlertCircle, Package, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function ToastManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const lastCheckRef = useRef<number>(0);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.businessId) return;

    // Initial check
    runSyncAndFetch();

    // Check every 5 minutes for new alerts
    const interval = setInterval(() => {
      runSyncAndFetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session]);

  async function runSyncAndFetch() {
    try {
      // 1. Trigger server-side stock scan (throttled to once every hour per client session to be safe, 
      // though the server action already throttles to 4 hours)
      const now = Date.now();
      if (now - lastCheckRef.current > 60 * 60 * 1000) {
        await syncLowStockNotifications();
        lastCheckRef.current = now;
      }

      // 2. Fetch unread notifications
      const notifications = await getNotifications();
      const unread = notifications.filter((n: any) => !n.isRead);

      // 3. Show toasts for new ones
      unread.forEach((n: any) => {
        if (!notifiedIdsRef.current.has(n.id)) {
          showNotificationToast(n);
          notifiedIdsRef.current.add(n.id);
        }
      });
    } catch (error) {
      console.error("Toast Sync Error:", error);
    }
  }

  function showNotificationToast(n: any) {
    const isCritical = n.title.toLowerCase().includes("critical") || n.type === "ERROR";
    
    toast.custom((t) => (
      <div 
        className="w-[350px] bg-white dark:bg-slate-900 border-l-4 border-rose-500 shadow-2xl rounded-2xl p-4 flex gap-4 items-start animate-in slide-in-from-right duration-500 cursor-pointer hover:scale-[1.02] transition-transform"
        onClick={() => {
           toast.dismiss(t);
           router.push("/dashboard/inventory/products");
        }}
      >
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30">
          {n.title.includes("Stock") ? <Package className="h-5 w-5 text-rose-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{n.title}</h4>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug">{n.message}</p>
          <div className="flex items-center gap-2 pt-1">
             <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Urgent Action</span>
             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Click to View</span>
          </div>
        </div>
      </div>
    ), {
      duration: 10000, // Show for 10 seconds
      position: "top-right"
    });
  }

  return null;
}
