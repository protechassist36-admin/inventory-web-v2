"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export const SplashScreen = () => {
    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative w-32 h-32 mb-8">
                <Image src="/images/logo2.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-6 text-white font-bold tracking-widest uppercase text-xs animate-pulse">Initializing Nexus Super Control...</p>
        </motion.div>
    );
};
