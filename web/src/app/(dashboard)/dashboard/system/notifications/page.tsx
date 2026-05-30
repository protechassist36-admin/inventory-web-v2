"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  Eye, 
  Clock,
  Sparkles,
  RefreshCw,
  BellRing,
  MoreVertical,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notification";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error: any) {
      toast.error("Failed to sync alert stream.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast.success("Alert acknowledged.");
    } catch (error) {
      toast.error("Failed to update alert state.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All alerts synchronized.");
    } catch (error) {
      toast.error("Bulk synchronization failed.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Alert node purged.");
    } catch (error) {
      toast.error("Failed to purge alert node.");
    }
  }

  const filteredNotifs = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Bell className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligence Alerts</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Notification Center</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit real-time system broadcasts and operational signal nodes.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <Button variant="outline" onClick={handleMarkAllRead} className="flex-1 md:flex-none h-12 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest gap-2">
              <Check className="h-4 w-4" /> Mark All Read
           </Button>
           <Button onClick={fetchData} variant="outline" className="h-12 w-12 rounded-xl border-slate-200 flex items-center justify-center">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Total Alerts", value: notifications.length.toString().padStart(2, '0'), icon: BellRing, color: "text-blue-500" },
           { label: "Unread Signals", value: unreadCount.toString().padStart(2, '0'), icon: Sparkles, color: "text-amber-500" },
           { label: "Critical Nodes", value: notifications.filter(n => n.type === 'ERROR' || n.type === 'CRITICAL').length.toString().padStart(2, '0'), icon: AlertCircle, color: "text-rose-500" },
           { label: "Sync Status", value: "Verified", icon: CheckCircle2, color: "text-emerald-500" }
         ].map((stat, i) => (
           <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <stat.icon className={cn("h-5 w-5 mb-4", stat.color)} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{stat.value}</h2>
           </Card>
         ))}
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50">
           <div className="relative max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search alert title or message..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
           {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-6">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Neural Signals...</p>
             </div>
           ) : filteredNotifs.length === 0 ? (
             <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                   <Bell className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No intelligence signals detected</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                <AnimatePresence mode="popLayout">
                  {filteredNotifs.map((n, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={n.id} 
                      className={cn("p-8 flex items-start justify-between group transition-all", n.isRead ? "opacity-60" : "bg-blue-50/10 dark:bg-blue-900/5")}
                    >
                       <div className="flex gap-6">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white dark:border-slate-800", 
                            n.type === 'ERROR' ? "bg-rose-500/10 text-rose-600" : 
                            n.type === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-600" :
                            "bg-blue-500/10 text-blue-600")}>
                             {n.type === 'ERROR' ? <AlertCircle size={20} /> : n.type === 'SUCCESS' ? <CheckCircle2 size={20} /> : <Info size={20} />}
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{n.title}</h4>
                                {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                             </div>
                             <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-2xl leading-relaxed mb-2">{n.message}</p>
                             <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock size={10} /> {format(new Date(n.createdAt), "MMM dd, HH:mm")}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <span>Signal Node: {n.id.substring(0, 8)}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {!n.isRead && (
                             <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)} className="h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50">
                                Acknowledge
                             </Button>
                          )}
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl">
                                   <MoreVertical size={16} className="text-slate-400" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                                <DropdownMenuItem onClick={() => handleDelete(n.id)} className="text-rose-600 font-bold uppercase text-[9px] tracking-widest">
                                   <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Node
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
