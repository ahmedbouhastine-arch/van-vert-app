
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
            <span className="text-2xl font-headline font-bold text-foreground">
                Van-Vert
            </span>
        </div>
        {children}
      </div>
    </div>
  );
}
