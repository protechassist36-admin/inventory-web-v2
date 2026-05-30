"use client";

import { 
  Plus, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions = [
    { label: "New Sale", icon: ShoppingCart, url: "/dashboard/pos", color: "bg-emerald-500" },
    { label: "Add Product", icon: Package, url: "/dashboard/inventory/products", color: "bg-indigo-500" },
    { label: "Add Patient", icon: Users, url: "/dashboard/patients", color: "bg-blue-500" },
    { label: "Record Expense", icon: DollarSign, url: "/dashboard/accounting/expenses", color: "bg-rose-500" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[150] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 group cursor-pointer"
                onClick={() => {
                  router.push(action.url);
                  setIsOpen(false);
                }}
              >
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn("p-4 rounded-2xl text-white shadow-2xl transition-transform hover:scale-110 active:scale-95", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-[2rem] shadow-2xl transition-all duration-500",
          isOpen ? "bg-slate-900 rotate-180" : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? <ChevronUp className="h-8 w-8 text-white" /> : <Plus className="h-8 w-8 text-white" />}
      </Button>
    </div>
  );
}
