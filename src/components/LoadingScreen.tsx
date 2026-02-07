'use client';

import { Plane } from "lucide-react";

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-primary"></div>
                <Plane className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground drop-shadow-sm">{text}</p>
        </div>
    )
}
