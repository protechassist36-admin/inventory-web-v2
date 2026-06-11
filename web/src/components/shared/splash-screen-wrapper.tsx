"use client";
import { useState, useEffect } from "react";
import { SplashScreen } from "./splash-screen";
import { AnimatePresence } from "framer-motion";

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log("DEBUG: Splash mounted");
        const hasShown = sessionStorage.getItem('splash_shown');
        if (!hasShown) {
            console.log("DEBUG: Showing splash");
            setShowSplash(true);
            const timer = setTimeout(() => {
                console.log("DEBUG: Hiding splash (timer)");
                setShowSplash(false);
                sessionStorage.setItem('splash_shown', 'true');
            }, 3500); 
            
            // Fallback to force show children after 6s in case splash gets stuck
            const fallbackTimer = setTimeout(() => {
                console.log("DEBUG: Forcing show children (fallback)");
                setShowSplash(false);
            }, 6000);

            return () => {
                clearTimeout(timer);
                clearTimeout(fallbackTimer);
            };
        }
    }, []);

    if (!mounted) return <div className="fixed inset-0 bg-slate-950" />;

    return (
        <>
            <AnimatePresence mode="wait">
                {showSplash && <SplashScreen key="splash" />}
            </AnimatePresence>
            {!showSplash && children}
        </>
    );
}
