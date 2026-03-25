'use client';
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, FileText, MessageSquare, Plane, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Centralized Documents",
    description: "Easily upload and manage all required documents, from your ID to medical certificates, in a secure digital hub.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Stay informed with live updates on your application status, from draft to approval, without any guesswork.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description: "Receive direct feedback from administrators on your application and documents, ensuring clarity and quick resolutions.",
  },
];

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[120px]" 
        />
      </div>

      <header className="glass-morphism h-16 flex items-center justify-between px-4 md:px-8 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 45, scale: 1.1 }}
            className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"
          >
            <Plane className="h-6 w-6" />
          </motion.div>
          <span className="text-2xl font-bold font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Van-Vert
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Sign Up</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 z-10">
        <section className="container mx-auto px-4 pt-32 pb-20 text-center md:px-6 md:pt-48 md:pb-32 relative">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Shield className="h-4 w-4" />
              <span>Certified Pilot Conversion Platform</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl font-extrabold font-headline tracking-tight sm:text-7xl md:text-8xl mb-8 leading-[1.1]">
              Seamless <span className="text-gradient">Pilot License</span> Conversion
            </motion.h1>
            
            <motion.p variants={itemVariants} className="mt-6 text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto leading-relaxed">
              Van-Vert digitizes the complex process of converting your foreign pilot license. 
              Efficiency, transparency, and clarity in every step.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 transition-all group">
                  Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-2xl glass-card hover:bg-white/5 transition-all">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-16 flex items-center justify-center gap-8 text-muted-foreground/60 text-sm font-medium grayscale opacity-50">
               <div className="flex items-center gap-2 saturate-0">
                  <Zap className="h-4 w-4" /> Trusted by 500+ Pilots
               </div>
               <div className="w-px h-4 bg-border" />
               <div>Global Compliance Support</div>
            </motion.div>
          </motion.div>
        </section>

        <section className="py-24 relative">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-16 text-center"
                >
                    <h2 className="text-4xl font-bold font-headline tracking-tight sm:text-5xl mb-4">A Modern Solution for Pilots</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Everything you need for a smooth transition to your new skies.</p>
                </motion.div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  {features.map((feature, idx) => (
                    <FeatureCard key={feature.title} {...feature} index={idx} />
                  ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-background/20 backdrop-blur-lg">
        <div className="container mx-auto flex flex-col md:flex-row h-auto md:h-20 items-center justify-between px-4 py-8 md:py-0 text-sm text-muted-foreground md:px-8 gap-4">
          <p>&copy; {new Date().getFullYear()} Van-Vert. Built for the modern aviator.</p>
           <nav className="flex items-center gap-8">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
