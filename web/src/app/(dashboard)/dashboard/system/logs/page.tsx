"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Search, 
  Filter, 
  History, 
  User, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Eye,
  ArrowRight,
  Database,
  Lock,
  RefreshCw,
  FileJson
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuditLogs } from "@/lib/actions/audit";
import { format } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error: any) {
      toast.error("Failed to sync neural security stream.");
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Shield className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Security Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Audit Logs</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">High-fidelity stream of system mutations and authorized node interactions.</p>
        </div>

        <Button onClick={fetchData} variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest gap-2">
           <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Re-Sync Stream
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Total Events", value: logs.length.toString().padStart(2, '0'), icon: Database, color: "text-blue-500" },
           { label: "Critical Actions", value: logs.filter(l => l.action === 'DELETE' || l.action === 'TERMINATE').length.toString().padStart(2, '0'), icon: AlertCircle, color: "text-rose-500" },
           { label: "System Uptime", value: "99.9%", icon: Activity, color: "text-emerald-500" },
           { label: "Encrypted State", value: "Verified", icon: Lock, color: "text-indigo-500" }
         ].map((stat, i) => (
           <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
              <stat.icon className={cn("h-5 w-5 mb-4", stat.color)} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{stat.value}</h2>
           </Card>
         ))}
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search actions, entities, or users..." 
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-500">
              Live Stream <Activity className="ml-2 h-3 w-3 animate-pulse text-emerald-500" />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-none">
                   <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Operation Node</TableHead>
                   <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Target Entity</TableHead>
                   <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Authorized User</TableHead>
                   <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Timestamp</TableHead>
                   <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Context</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => <TableRow key={i} className="h-20 border-b border-slate-50 animate-pulse"><TableCell colSpan={5} /></TableRow>)
                ) : filteredLogs.length === 0 ? (
                   <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                         <History className="h-8 w-8 text-slate-200 mx-auto mb-4" />
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No activity nodes recorded</p>
                      </TableCell>
                   </TableRow>
                ) : (
                   filteredLogs.map((log) => (
                     <TableRow key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50 h-20">
                        <TableCell className="px-8">
                           <div className="flex items-center gap-3">
                              <div className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm", 
                                 log.action === 'CREATE' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50" :
                                 log.action === 'UPDATE' ? "bg-blue-500/10 text-blue-600 border-blue-200/50" :
                                 "bg-rose-500/10 text-rose-600 border-rose-200/50")}>
                                 {log.action}
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">{log.entity}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {log.entityId?.substring(0, 12)}...</div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <User size={12} className="text-slate-400" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.userName}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                              <Clock size={12} className="text-primary" />
                              {format(new Date(log.createdAt), "HH:mm:ss")}
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary transition-all"
                             onClick={() => {
                                setSelectedLog(log);
                                setIsDetailsOpen(true);
                             }}
                           >
                              <Eye size={16} />
                           </Button>
                        </TableCell>
                     </TableRow>
                   ))
                )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* NEURAL DATA DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white text-slate-900">
           <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Shield size={120} />
              </div>
              <div className="relative z-10 space-y-1">
                 <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Security Node Insight</div>
                 <h3 className="text-2xl font-[1000] tracking-tighter uppercase italic">{selectedLog?.action} {selectedLog?.entity}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLog && format(new Date(selectedLog.createdAt), "PPPP p")}</p>
              </div>
           </div>

           <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Old Data State</p>
                    <pre className="text-[10px] font-mono text-slate-600 overflow-hidden text-ellipsis">{selectedLog?.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : "NULL STATE"}</pre>
                 </div>
                 <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">New Data Mutation</p>
                    <pre className="text-[10px] font-mono text-emerald-700 overflow-hidden text-ellipsis">{selectedLog?.newData ? JSON.stringify(selectedLog.newData, null, 2) : "NULL STATE"}</pre>
                 </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                       <User size={20} className="text-slate-400" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized By</p>
                       <p className="text-sm font-bold text-slate-900">{selectedLog?.userName}</p>
                    </div>
                 </div>
                 <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest">
                    <ArrowRight className="h-3.5 w-3.5 mr-2" /> View User Profile
                 </Button>
              </div>
           </div>

           <div className="p-8 pt-0 flex gap-3">
              <Button className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white">
                 <FileJson className="h-4 w-4 mr-2" /> Export Raw JSON
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => setIsDetailsOpen(false)}>
                 Close Detail
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
