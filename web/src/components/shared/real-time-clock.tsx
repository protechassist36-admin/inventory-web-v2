"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function RealTimeClock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-6 opacity-0">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">...</span>
          <span className="text-sm font-bold text-slate-400">...</span>
        </div>
        <div className="h-10 w-px bg-slate-100 hidden sm:block" />
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-xl font-[1000] text-slate-900 tracking-tighter tabular-nums">00:00:00</span>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex items-center gap-6 animate-in fade-in duration-1000">
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">
          {getGreeting()}
        </span>
        <span className="text-sm font-bold text-slate-400">
          {formatDate(time)}
        </span>
      </div>
      
      <div className="h-10 w-px bg-slate-100 hidden sm:block" />
      
      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-md">
        <Clock className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-xl font-[1000] text-slate-900 tracking-tighter tabular-nums">
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
}
