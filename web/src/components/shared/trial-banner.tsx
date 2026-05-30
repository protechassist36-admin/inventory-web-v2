"use client";

import { useSession } from "next-auth/react";
import { Clock, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TrialBanner() {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (session?.user?.trialEndDate) {
        const end = new Date(session.user.trialEndDate).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft({ days, hours, minutes });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0 });
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  if (!timeLeft || timeLeft.days > 14) return null;

  const isExpiringSoon = timeLeft.days <= 3;

  return (
    <div className={cn(
      "w-full px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 border-b relative overflow-hidden",
      isExpiringSoon 
        ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-800" 
        : "bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-slate-800"
    )}>
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "p-2 rounded-xl flex items-center justify-center",
          isExpiringSoon ? "bg-white/20 backdrop-blur-md" : "bg-primary/20 backdrop-blur-md"
        )}>
          {isExpiringSoon ? <AlertTriangle className="h-4 w-4 text-white animate-pulse" /> : <Zap className="h-4 w-4 text-primary animate-pulse" />}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <div className="space-y-0.5">
             <span className="font-black text-[11px] uppercase tracking-[0.2em] opacity-90">Experience Pro Features</span>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest hidden sm:block">Full access to African trade intelligence OS</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
             <div className="flex gap-3">
                {[
                  { label: "Days", val: timeLeft.days },
                  { label: "Hrs", val: timeLeft.hours },
                  { label: "Min", val: timeLeft.minutes }
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center min-w-[32px]">
                     <span className="text-sm font-black tracking-tighter leading-none">{t.val.toString().padStart(2, '0')}</span>
                     <span className="text-[7px] font-black uppercase opacity-60 tracking-widest mt-0.5">{t.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <Link 
        href="/dashboard/settings" 
        className={cn(
          "px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 relative z-10",
          isExpiringSoon ? "bg-white text-rose-600 shadow-lg shadow-rose-900/20" : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
        )}
      >
        Choose Your Plan <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
