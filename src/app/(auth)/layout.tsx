import { Plane } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plane className="h-7 w-7" />
            </div>
            <span className="text-2xl font-headline font-bold text-foreground">
                PilotPack
            </span>
        </div>
        {children}
      </div>
    </div>
  );
}
