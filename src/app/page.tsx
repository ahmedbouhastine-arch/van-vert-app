
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, FileText, MessageSquare, Plane } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";

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
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline">
              Van-Vert
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button>Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute h-full w-full animate-spin-slow rounded-full border-4 border-dashed border-primary/50"></div>
                    <Plane className="h-12 w-12 text-primary" />
                </div>
            </div>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight sm:text-5xl md:text-6xl">
              Seamless Pilot License Conversion
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Van-Vert simplifies the process of converting your foreign pilot license. Upload documents, track progress, and communicate with administrators—all in one place.
            </p>
            <div className="mt-10">
              <Link href="/login">
                <Button size="lg">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-20 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold font-headline tracking-tight">A Modern Solution for Pilots</h2>
                    <p className="mt-2 text-muted-foreground">Everything you need for a smooth transition.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                  {features.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} />
                  ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground md:px-6">
          <p>&copy; {new Date().getFullYear()} Van-Vert. All rights reserved.</p>
           <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
