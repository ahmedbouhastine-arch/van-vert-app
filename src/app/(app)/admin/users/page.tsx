
'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { UserManagementClient } from "./_components/UserManagementClient";

function RedirectToAdminDashboard() {
    const router = useRouter();
    React.useEffect(() => {
        router.push('/admin');
    }, [router]);
    return <LoadingScreen text="Access Denied. Redirecting..." />;
}

export default function UserManagementPage() {
    const { user, loading, claims } = useUser();

    if (loading || !user) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    if (claims?.role !== 'head-admin') {
        return <RedirectToAdminDashboard />;
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Promote or demote users to different roles.</p>
            </div>
            <UserManagementClient currentUser={user} currentUserClaims={claims} />
        </div>
    );
}
