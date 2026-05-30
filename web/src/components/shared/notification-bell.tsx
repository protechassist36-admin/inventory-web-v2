"use client";

import { useState, useEffect } from "react";
import { Bell, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getNotifications, markAsRead } from "@/lib/actions/notification";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // In a real app, you might want to poll or use WebSockets here
  }, []);

  async function fetchNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case "WARNING": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "ERROR": return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-xl bg-slate-50 border border-slate-100">
           <Bell className="h-4 w-4 text-slate-400" />
           {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white border-2 border-white">
                {unreadCount}
             </span>
           )}
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-80 rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-900 p-4 text-white">
           <h3 className="font-black text-sm uppercase tracking-widest">System Alerts</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
           {notifications.length === 0 ? (
             <div className="p-8 text-center text-slate-400 font-bold italic text-sm">
                No recent alerts.
             </div>
           ) : (
             notifications.map((n) => (
               <div 
                 key={n.id} 
                 className={cn(
                   "p-4 border-b border-slate-50 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors",
                   !n.isRead && "bg-slate-50/50"
                 )}
                 onClick={() => handleMarkAsRead(n.id)}
               >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                     <p className={cn("text-xs font-black text-slate-800", !n.isRead && "text-primary")}>{n.title}</p>
                     <p className="text-[10px] font-bold text-slate-400 leading-tight">{n.message}</p>
                     <p className="text-[8px] font-black text-slate-300 uppercase">{format(new Date(n.createdAt), "hh:mm a • MMM dd")}</p>
                  </div>
               </div>
             ))
           )}
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
           <Button variant="ghost" className="h-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">Clear All History</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
