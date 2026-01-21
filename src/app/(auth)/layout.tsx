import { Plane } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-primary" />
              <span className="text-2xl font-headline font-bold text-foreground">
                Van-Vert
              </span>
            </div>
        </div>
        {children}
      </div>
    </div>
  );
}
