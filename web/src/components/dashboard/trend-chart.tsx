"use client";

import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TrendChartProps {
  data: any[];
  title: string;
  description: string;
  dataKey: string;
  categoryKey: string;
  color?: string;
}

export function TrendChart({ 
  data, 
  title, 
  description, 
  dataKey, 
  categoryKey,
  color = "#4f46e5" 
}: TrendChartProps) {
  return (
    <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm overflow-hidden h-full">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey={categoryKey} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{payload[0].payload[categoryKey]}</p>
                        <p className="text-sm font-black tracking-tight">Le {payload[0].value?.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
