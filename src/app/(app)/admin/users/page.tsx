
'use client';

import { useUser } from "@/firebase";
import { redirect } from "next/navigation";
import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { UserManagementClient } from "./_components/UserManagementClient";

export default function UserManagementPage() {
    const { user, loading, claims } = useUser();

    if (loading || !user) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    const isAuthorized = claims?.role === 'head-admin';

    if (!isAuthorized) {
        redirect('/admin');
        return null; // Stop rendering immediately
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Promote or demote users to different roles.</p>
            </div>
            <UserManagementClient currentUser={user} currentUserClaims={claims} isAuthorized={isAuthorized} />
        </div>
    );
}
