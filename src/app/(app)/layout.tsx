
'use client';

import Link from "next/link";
import { PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/UserNav";
import { MainNavLinks, SecondaryNavLinks, MobileNavLinks } from "./_components/NavLinks";
import { Breadcrumbs } from "./_components/Breadcrumbs";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, loading, claims } = useUser();
    const router = useRouter();
    const homePath = (claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer') ? "/admin" : "/dashboard";

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (!user.emailVerified) {
            router.push('/verify-email');
            return;
        }

    }, [user, loading, router]);
    
    if (loading || !user || !user.emailVerified) {
        return <LoadingScreen />;
    }


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
                href={homePath}
                className="flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
              >
                V<span className="sr-only">Van-Vert</span>
            </Link>
          <MainNavLinks claims={claims} />
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <SecondaryNavLinks claims={claims} />
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href={homePath}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  Van-Vert
                </Link>
                 <MobileNavLinks claims={claims} />
              </nav>
            </SheetContent>
          </Sheet>
          <Breadcrumbs />
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <UserNav />
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
