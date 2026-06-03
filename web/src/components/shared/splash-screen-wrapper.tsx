"use client";
import { useState, useEffect } from "react";
import { SplashScreen } from "./splash-screen";
import { AnimatePresence } from "framer-motion";

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <AnimatePresence>
                {showSplash && <SplashScreen />}
            </AnimatePresence>
            {!showSplash && children}
        </>
    );
}
