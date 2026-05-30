"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  MapPin, 
  LogIn, 
  LogOut, 
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAttendanceLogs, clockIn, clockOut } from "@/lib/actions/attendance";
import { getUsers } from "@/lib/actions/user";
import { format, differenceInHours } from "date-fns";
import { cn, getIndustryColor } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AttendancePage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [clockInData, setClockInData] = useState({
    userId: "",
    note: ""
  });

  const businessType = session?.user?.businessType || "SHOP";
  const colors = getIndustryColor(businessType);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      console.log("ATTENDANCE: Fetching data...");
      const [logsData, usersData] = await Promise.all([
        getAttendanceLogs(),
        getUsers()
      ]);
      console.log("ATTENDANCE: Received logs:", logsData.length);
      console.log("ATTENDANCE: Received users:", usersData.length, usersData);
      setLogs(logsData);
      setUsers(usersData);
      if (usersData.length > 0) {
        setClockInData(prev => ({ ...prev, userId: usersData[0].id }));
      }
    } catch (error: any) {
      console.error("ATTENDANCE SYNC ERROR:", error);
      toast.error(error.message || "Failed to sync attendance stream.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClockIn() {
    try {
      await clockIn(clockInData.userId, clockInData.note);
      toast.success("Personnel node activated for cycle.");
      setClockInData({ ...clockInData, note: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize node.");
    }
  }

  async function handleClockOut(id: string) {
    try {
      await clockOut(id);
      toast.success("Personnel node cycle terminated.");
      fetchData();
    } catch (error) {
      toast.error("Failed to terminate cycle.");
    }
  }

  const activeLogs = logs.filter(l => !l.clockOut).length;

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg text-white shadow-lg", colors.primary)}>
                 <Clock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Shift Intelligence</span>
           </div>
           <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight">Attendance Monitoring</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit staff connectivity cycles and verify operational occupancy.</p>
        </div>

        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
           <div className="flex -space-x-3 ml-2">
              {logs.filter(l => !l.clockOut).slice(0, 3).map((l, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white dark:border-slate-900 rounded-full">
                   <AvatarFallback className={cn("text-[8px] font-black text-white", colors.primary)}>{l.userName.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
           </div>
           <div className="pr-4 py-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Nodes</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{activeLogs.toString().padStart(2, '0')} Online</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Personnel</Label>
                  <Select value={clockInData.userId} onValueChange={v => setClockInData({...clockInData, userId: v})}>
                     <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                        <SelectValue placeholder={users.length > 0 ? "Select staff member..." : "No personnel nodes detected"} />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-200 bg-white">
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id} className="font-bold">{u.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  {users.length === 0 && !loading && (
                    <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2">
                       <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                       <p className="text-[9px] text-rose-600 font-bold uppercase leading-tight">No personnel nodes found. Register staff in the "Staff Network" hub to initialize attendance logs.</p>
                    </div>
                  )}
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session Note</Label>
                  <Input 
                    placeholder="e.g. Morning Shift Alpha..." 
                    className="h-12 rounded-xl"
                    value={clockInData.note}
                    onChange={e => setClockInData({...clockInData, note: e.target.value})}
                  />
               </div>
            </div>

            <Button onClick={handleClockIn} className={cn("w-full h-16 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl mt-8", colors.primary)}>
               <LogIn className="h-4 w-4 mr-2" /> Initialize Clock-In
            </Button>
         </Card>

         <Card className="lg:col-span-3 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between gap-4">
               <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search personnel logs..." 
                    className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
               <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-500">
                  Daily Stream <Calendar className="ml-2 h-3 w-3" />
               </Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow className="hover:bg-transparent border-none">
                       <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 px-8">Staff Node</TableHead>
                       <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Clock In</TableHead>
                       <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Clock Out</TableHead>
                       <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Cycle Duration</TableHead>
                       <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Status</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       Array.from({ length: 5 }).map((_, i) => <TableRow key={i} className="h-20 border-b border-slate-50 animate-pulse"><TableCell colSpan={5} /></TableRow>)
                    ) : filteredLogs.length === 0 ? (
                       <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                             <History className="h-8 w-8 text-slate-200 mx-auto mb-4" />
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No shift entries registered</p>
                          </TableCell>
                       </TableRow>
                    ) : (
                       filteredLogs.map((log) => (
                         <TableRow key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50 h-20">
                            <TableCell className="px-8">
                               <div className="font-black text-slate-900 dark:text-white tracking-tight leading-none">{log.userName}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{log.note || "General Duty"}</div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                                  <LogIn size={10} className="text-emerald-500" />
                                  {format(new Date(log.clockIn), "HH:mm")}
                               </div>
                            </TableCell>
                            <TableCell>
                               {log.clockOut ? (
                                 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                                    <LogOut size={10} className="text-rose-500" />
                                    {format(new Date(log.clockOut), "HH:mm")}
                                 </div>
                               ) : (
                                 <Button variant="ghost" size="sm" onClick={() => handleClockOut(log.id)} className="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-[8px] uppercase tracking-widest">Terminate Cycle</Button>
                               )}
                            </TableCell>
                            <TableCell>
                               <div className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">
                                  {log.clockOut ? `${differenceInHours(new Date(log.clockOut), new Date(log.clockIn))}h node` : "Session Active"}
                               </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                               <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm", 
                                  log.status === 'ON_TIME' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                                  {log.status === 'ON_TIME' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                  {log.status}
                               </div>
                            </TableCell>
                         </TableRow>
                       ))
                    )}
                 </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
