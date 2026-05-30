import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/shared/count-up";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({ title, value, description, icon: Icon, delay = 0 }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-7 shadow-2xl hover:border-indigo-500/50 transition-all duration-500 group overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        
        <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{title}</CardTitle>
          <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
             <Icon className="h-5 w-5 text-indigo-400" />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="text-4xl font-black text-white tracking-tighter leading-none">
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </div>
          <div className="mt-4 flex flex-col gap-2">
             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.5, delay: delay + 0.3 }}
                  className="h-full bg-indigo-500 rounded-full"
                />
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
