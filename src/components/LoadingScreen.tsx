'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  const [showForceSignOut, setShowForceSignOut] = useState(false);

  useEffect(() => {
    // Show the "Force Sign Out" button if loading takes more than 45 seconds
    const timer = setTimeout(() => {
      setShowForceSignOut(true);
    }, 45000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleForceReset = async () => {
    try {
      // 1. Force wipe the server session cookie
      await fetch('/api/auth/session/logout', { method: 'POST' });
      
      // 2. Wipe client-side storage to unstick any bugged states
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Hard reload the window to the login page to guarantee a fresh state
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  };

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
        <div className="flex flex-col items-center gap-4">
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
          
          <AnimatePresence>
            {showForceSignOut && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <Button 
                  onClick={handleForceReset}
                  variant="outline" 
                  className="mt-4 bg-red-500/10 border-red-500/20 text-red-100 hover:bg-red-500/20 hover:text-white transition-all rounded-xl"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Taking too long? Force Sign Out
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
