'use client';

import { motion } from "framer-motion";
import { Plane } from "lucide-react";

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-64 h-64 bg-primary/30 rounded-full blur-[80px]" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" 
        />
      </div>

      {/* Loading Container */}
      <div className="z-10 flex flex-col items-center justify-center gap-8">
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Outer Rotating Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-white/10 border-t-primary border-r-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
          
          {/* Inner Pulsing Ring */}
          <motion.div 
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-2 rounded-full border border-primary/30 bg-primary/5"
          />

          {/* Plane Icon */}
          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="h-10 w-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="glass-card px-8 py-3 rounded-full border border-white/10"
        >
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm font-semibold tracking-widest uppercase text-white"
          >
            {text}
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
