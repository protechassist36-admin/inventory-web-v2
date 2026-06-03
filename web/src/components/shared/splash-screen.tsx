"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export const SplashScreen = () => {
    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-40 h-40 mb-10"
            >
                <Image src="/images/logo2.png" alt="Logo" fill className="object-contain" />
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
            >
                <div className="relative h-16 w-16 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-white font-bold tracking-[0.2em] uppercase text-xs">Initializing Protech Super Control...</p>
            </motion.div>
        </motion.div>
    );
};
