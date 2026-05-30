"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ShieldCheck, Globe, Zap, Database, Server, Terminal, LogOut } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSystemStats } from "@/lib/actions/super-admin";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/super-admin/stat-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Mock Data
const MOCK_STATS = [
  { title: "Total Tenants", value: "--", description: "Active business nodes", icon: Globe },
  { title: "Revenue", value: "--", description: "Monthly GMV across platform", icon: Database },
  { title: "System Load", value: "--", description: "Compute resource usage", icon: Server },
  { title: "Active Subs", value: "--", description: "No money paid yet", icon: Zap },
];

export default function EnhancedSuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    businessCount: 0,
    userCount: 0,
    revenue: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "SUPERADMIN")) {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchStats();
    }
  }, [status, session, router]);

  async function fetchStats() {
    try {
      const data = await getSystemStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
         <div className="relative h-16 w-16 border-4 border-slate-900 border-t-indigo-500 rounded-full animate-spin" />
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Nexus Super Control...</p>
      </div>
    );
  }

  const adminStats = [
    { title: "Network Tenants", value: stats.businessCount, description: "Operational Business Units", icon: Globe },
    { title: "Intelligence Nodes", value: stats.userCount, description: "Active System Operators", icon: Database },
    { title: "Network Revenue", value: `Le ${stats.revenue.toLocaleString()}`, description: "Global GMV Cycle", icon: Server },
    { title: "Nexus Priority", value: stats.activeSubscriptions, description: "Premium Data Stream", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
      {/* Immersive Background Decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Global Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 relative z-10">
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-[2rem] overflow-hidden border-4 border-slate-900 shadow-2xl shadow-indigo-500/20 rotate-3">
               <Image src="/images/logo2.jpeg" alt="Protech Logo" fill className="object-cover" />
            </div>
            <div className="space-y-1">
               <h1 className="text-4xl md:text-5xl font-[1000] text-white tracking-tighter uppercase italic">Protech Smart Inventory <span className="text-indigo-500">Super Control</span></h1>
               <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Centralized Infrastructure Command</p>
               </div>
            </div>
         </motion.div>
         
         <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl text-right">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Commanding</p>
               <p className="text-sm font-black text-white mt-1 uppercase tracking-tighter">Nexus System Admin</p>
            </div>
            <Button onClick={() => signOut()} variant="outline" className="h-14 px-8 rounded-2xl border-slate-800 bg-slate-950 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
               <LogOut className="mr-3 h-4 w-4" /> Terminate Control
            </Button>
         </div>
      </div>

      {/* Performance Matrix */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12 relative z-10">
        {adminStats.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      {/* Tactical Hub */}
      <div className="grid gap-8 lg:grid-cols-3 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
           <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.4)] h-full">
             <CardHeader className="p-0 pb-10">
                <div className="flex items-center gap-3 mb-2">
                   <Terminal className="h-5 w-5 text-indigo-500" />
                   <CardTitle className="text-2xl font-[1000] text-white uppercase tracking-tighter">Command Operations</CardTitle>
                </div>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Global tenant & security management</CardDescription>
             </CardHeader>
             <CardContent className="p-0 grid md:grid-cols-2 gap-6">
                <Link 
                   href="/super-admin/businesses"
                   className="group p-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:-translate-y-2 shadow-2xl shadow-indigo-600/20"
                >
                   <Globe className="mb-6 h-10 w-10 opacity-50 group-hover:scale-125 transition-transform" />
                   <h4 className="text-2xl font-black uppercase tracking-tight">Tenant Vault</h4>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-2">Manage all registered businesses</p>
                </Link>
                <Link 
                   href="/super-admin/logs"
                   className="group p-8 rounded-[2rem] bg-slate-950 border-2 border-slate-900 hover:border-indigo-500/50 text-white transition-all hover:-translate-y-2"
                >
                   <ShieldCheck className="mb-6 h-10 w-10 text-slate-700 group-hover:text-indigo-500 transition-colors" />
                   <h4 className="text-2xl font-black uppercase tracking-tight">Security Node</h4>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Platform audit & threat monitoring</p>
                </Link>
             </CardContent>
           </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
           <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.4)] h-full">
             <CardHeader className="p-0 pb-8">
                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Infrastructure Status</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live system health</CardDescription>
             </CardHeader>
             <CardContent className="p-0 space-y-6">
                {[
                  { label: "API Global Gateway", status: "Operational", color: "text-emerald-500" },
                  { label: "Database Main Cluster", status: "Healthy", color: "text-emerald-500" },
                  { label: "Predictive Engines", status: "Optimizing", color: "text-indigo-400" },
                  { label: "African Trade Sync", status: "Synchronized", color: "text-emerald-500" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-950/60 rounded-2xl border border-slate-900 hover:border-slate-800 transition-colors group">
                     <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{item.label}</span>
                     <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", item.color === "text-emerald-500" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-indigo-500 shadow-[0_0_8px_#6366f1]")} />
                        <span className={cn("text-xs font-[1000] uppercase italic", item.color)}>{item.status}</span>
                     </div>
                  </div>
                ))}
                
                <div className="pt-6">
                   <Button className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-500 hover:text-white transition-all">
                      Neural System Diagnostic
                   </Button>
                </div>
             </CardContent>
           </Card>
        </motion.div>
      </div>
    </div>
  );
}
