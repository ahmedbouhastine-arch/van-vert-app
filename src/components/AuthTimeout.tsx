"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

// Set timeout to 15 minutes (in milliseconds)
const TIMEOUT_MS = 15 * 60 * 1000;

export function AuthTimeout() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/session/logout', { method: 'POST' });
      await signOut(auth);
      
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
      });

      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Auth timeout logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    // Only reset the timer if we are not actively in the process of logging out
    if (!isLoggingOut) {
      timeoutId.current = setTimeout(performLogout, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Start initial timer
    resetTimer();

    // Events that signify user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup listeners and timer on unmount
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isLoggingOut]);

  // AuthTimeout is a silent logic component, it renders nothing.
  return null;
}
