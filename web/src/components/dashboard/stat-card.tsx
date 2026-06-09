import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CountUp } from "@/components/shared/count-up";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number | string | any;
  prefix?: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  delay?: number;
  href?: string;
}

export function StatCard({ title, value, prefix = "", description, icon: Icon, colorClass, bgClass, delay = 0, href }: StatCardProps) {
  // Defensive check for React Error #31
  let displayValue: any = value;
  if (typeof value === 'object' && value !== null) {
    console.error(`DEBUG: StatCard '${title}' received unexpected object:`, value);
    displayValue = JSON.stringify(value);
  }

  const CardContentWrapper = (
    <Card className={cn(
        "group relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-7 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 active:scale-[0.98]",
        href && "cursor-pointer"
    )}>
        {/* Animated Glow Backdrop */}
        <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08] dark:opacity-[0.05] blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-20", bgClass)} />
        
        <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
          <div className="space-y-1">
             <CardTitle className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">{title}</CardTitle>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">Real-time Node</p>
          </div>
          <div className={cn("p-3 sm:p-4 rounded-2xl transition-all duration-500 shadow-lg shadow-black/5 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-xl", bgClass)}>
              <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", colorClass)} />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex items-baseline gap-1.5">
            <div className="text-2xl sm:text-4xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-none">
              {prefix}<CountUp value={displayValue} />
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-3">
            <div className="h-1 sm:h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: "85%" }}
                 transition={{ duration: 1.5, delay: delay + 0.3, ease: "easeOut" }}
                 className={cn("h-full rounded-full bg-gradient-to-r from-transparent to-current", colorClass)} 
               />
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{description}</span>
               <div className={cn("px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-tighter", bgClass, colorClass)}>+12.5%</div>
            </div>
          </div>
        </CardContent>
      </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {href ? <Link href={href}>{CardContentWrapper}</Link> : CardContentWrapper}
    </motion.div>
  );
}
