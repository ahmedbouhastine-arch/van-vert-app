
'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { UserManagementClient } from "./_components/UserManagementClient";

export default function UserManagementPage() {
    const { user, loading, claims } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && claims?.role !== 'head-admin') {
            router.push('/admin');
        }
    }, [user, loading, claims, router]);

    if (loading || !user || claims?.role !== 'head-admin') {
        return <LoadingScreen text="Verifying Access..." />;
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
