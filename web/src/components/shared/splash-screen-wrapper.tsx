"use client";
import { useState, useEffect } from "react";
import { SplashScreen } from "./splash-screen";
import { AnimatePresence } from "framer-motion";

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        const hasShown = sessionStorage.getItem('splash_shown');
        if (hasShown) {
            setShowSplash(false);
        } else {
            setShowSplash(true);
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem('splash_shown', 'true');
            }, 10000);
            return () => clearTimeout(timer);
        }
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
