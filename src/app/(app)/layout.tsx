import Link from "next/link";
import { Home, Users, FileText, PanelLeft, Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PilotPackLogo } from "@/components/icons";
import { UserNav } from "@/components/UserNav";
import { NavLinks, SettingsLink } from "./_components/NavLinks";
import { Breadcrumbs } from "./_components/Breadcrumbs";
import { users } from "@/lib/data";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    // In a real app, you'd get this from an auth context
    const currentUser = users.find(u => u.id === 'user1'); // Mock: assuming user1 is logged in
    const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href={isAdmin ? "/admin" : "/dashboard"}
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <PilotPackLogo className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">PilotPack</span>
          </Link>
          <NavLinks />
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Link>
          <SettingsLink />
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
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <PilotPackLogo className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">PilotPack</span>
                </Link>
                 <Link
                  href="/dashboard"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </Link>
                {!isAdmin && (
                  <Link
                    href="/applications"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-5 w-5" />
                    Applications
                  </Link>
                )}
                {isAdmin && (
                    <Link
                    href="/admin"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                    <Users className="h-5 w-5" />
                    Admin
                    </Link>
                )}
                 <Link
                    href="/profile"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                 <Link
                    href="/settings"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
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
