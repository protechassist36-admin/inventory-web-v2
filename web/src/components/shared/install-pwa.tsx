"use client";

import { useState, useEffect } from "react";
import { Download, X, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[200]"
      >
        <div className="bg-slate-900 dark:bg-indigo-600 rounded-[2rem] p-6 shadow-2xl border border-white/10 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
               <Monitor className="h-6 w-6" />
            </div>
            <div className="space-y-1 pr-6">
               <h3 className="font-black text-sm uppercase tracking-widest">Install Desktop App</h3>
               <p className="text-xs text-white/70 leading-relaxed font-medium">
                 Get the full Protech Assist experience. Fast, secure, and accessible directly from your home screen.
               </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
             <Button 
               onClick={handleInstall}
               className="flex-1 h-11 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-black text-[10px] uppercase tracking-widest shadow-xl"
             >
                Install Now
             </Button>
             <Button 
               variant="ghost"
               onClick={() => setShowBanner(false)}
               className="h-11 rounded-xl text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest"
             >
                Maybe Later
             </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
