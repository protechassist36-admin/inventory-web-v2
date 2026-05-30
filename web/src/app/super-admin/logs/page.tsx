"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getAuditLogs } from "@/lib/actions/super-admin";
import { format } from "date-fns";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-700">
      <div>
         <h1 className="text-3xl font-[1000] tracking-tight text-slate-900">System Activity Audit</h1>
         <p className="text-slate-500 font-medium">Monitoring platform-wide transactions and admin actions.</p>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">Action</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Business</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Actor</TableHead>
              <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="border-slate-50">
                  <TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold italic">No logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                  <TableCell className="pl-8 py-4">
                    <div className="font-black text-slate-800 text-sm">{log.action}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{log.entity} - ID: {log.entityId}</div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-600">{log.business?.name || "Global"}</TableCell>
                  <TableCell className="font-bold text-slate-600">{log.user?.name || "System"}</TableCell>
                  <TableCell className="text-slate-400 font-medium">
                    {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
