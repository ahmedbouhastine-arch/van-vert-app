
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/types";
import { collection, type CollectionReference } from "firebase/firestore";
import * as serverActions from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton } from "@/components/vv/VvButton";


type Role = 'user' | 'admin' | 'head-admin' | 'reviewer';
type UserWithProfile = UserProfile & { id: string; photoURL?: string; role?: Role };

function UserRow({
    user,
    currentUser,
    currentUserClaims,
    onRoleChange,
    isUpdating
}: {
    user: UserWithProfile,
    currentUser: User,
    currentUserClaims: { role?: Role } | null | undefined,
    onRoleChange: (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => void,
    isUpdating: boolean
}) {
    const [selectedRole, setSelectedRole] = useState<Role>(user.role ?? 'user');

    const handleUpdate = () => {
        onRoleChange(user.id, selectedRole as Role);
    };

    const isCurrentUser = user.id === currentUser.uid || user.email === currentUser.email;

    const canPerformActions = (() => {
        if (isCurrentUser) return false;
        const currentUserRole = currentUserClaims?.role;
        if (currentUserRole === 'head-admin') return true;
        if (currentUserRole === 'admin') {
            return user.role !== 'head-admin';
        }
        return false;
    })();

    const isPromotionToHeadAdminDisabled = currentUserClaims?.role === 'admin';

    return (
        <TableRow className="border-[var(--vv-border-soft)]">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[var(--vv-border)]">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />}
                        <AvatarFallback className="bg-[var(--sky-pale)] text-[var(--sky)]">{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-outfit text-sm font-semibold text-[var(--navy)]">{user.displayName}</div>
                        <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {canPerformActions ? (
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
                        <SelectTrigger className="w-[180px] rounded-lg border-[var(--vv-border)]">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="head-admin" disabled={isPromotionToHeadAdminDisabled}>Head Admin</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                            <div className="w-[180px] px-3 py-2 text-sm capitalize text-[var(--text-secondary)]">
                                {(user.role || 'user').replace(/-/g, ' ')}
                            </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                {canPerformActions ? (
                    <div className="flex items-center justify-end gap-2">
                        <VvButton size="sm" onClick={handleUpdate} disabled={selectedRole === user.role || isUpdating} loading={isUpdating}>
                            Update role
                        </VvButton>
                    </div>
                ) : isCurrentUser ? (
                     <span className="pr-4 text-sm text-[var(--text-muted)]">Cannot edit self</span>
                ) : (
                    <span className="pr-4 text-sm text-[var(--text-muted)]">Permission denied</span>
                )
                }
            </TableCell>
        </TableRow>
    );
}

/* ── Skeletons ─────────────────────────────────────────────────────── */

function UserRowSkeleton() {
    return (
        <TableRow className="border-[var(--vv-border-soft)]">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-44" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-9 w-[180px] rounded-lg" /></TableCell>
            <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-28 rounded-lg" /></TableCell>
        </TableRow>
    );
}

function UsersPageSkeleton() {
    return (
        <PageTransition>
            <div className="mb-8 space-y-2.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-60 max-w-full" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="rounded-xl border border-[var(--vv-border)] bg-white">
                <div className="space-y-2 border-b border-[var(--vv-border-soft)] p-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <Table>
                    <TableHeader className="bg-[var(--surface)]">
                        <TableRow className="border-[var(--vv-border-soft)] hover:bg-transparent">
                            <TableHead className="text-[var(--text-muted)]">User</TableHead>
                            <TableHead className="text-[var(--text-muted)]">Role</TableHead>
                            <TableHead className="text-right text-[var(--text-muted)]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => <UserRowSkeleton key={i} />)}
                    </TableBody>
                </Table>
            </div>
        </PageTransition>
    );
}

export default function UserManagementPage() {
    const { user, claims } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const usersQuery = useMemoFirebase(() => {
        if (firestore) {
            return collection(firestore, 'users') as CollectionReference<UserWithProfile>;
        }
        return null;
    }, [firestore]);

    const { data: users, isLoading: usersIsLoading } = useCollection<UserWithProfile>(usersQuery);

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => {
        if (!user) return;
        setIsUpdating(userId);
        try {
            const idToken = await user.getIdToken();
            const { success } = await serverActions.updateUserRoleAction(userId, newRole, idToken);
            if (!success) throw new Error('Failed to update role');
            toast({
                title: "Role Updated",
                description: `User role has been successfully changed to ${newRole}.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: "You may not have permission to perform this action.",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    if (!user) {
        return <UsersPageSkeleton />
    }

    return (
        <PageTransition>
            <VvPageHeader
              kicker="Operations"
              title="User Management"
              sub="Promote or demote users to different roles."
            />
            <div className="rounded-xl border border-[var(--vv-border)] bg-white">
                <div className="border-b border-[var(--vv-border-soft)] p-6">
                    <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">All users</h3>
                    <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">View and manage user roles in the system.</p>
                </div>
                <Table>
                    <TableHeader className="bg-[var(--surface)]">
                        <TableRow className="border-[var(--vv-border-soft)] hover:bg-transparent">
                            <TableHead className="text-[var(--text-muted)]">User</TableHead>
                            <TableHead className="text-[var(--text-muted)]">Role</TableHead>
                            <TableHead className="text-right text-[var(--text-muted)]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usersIsLoading && [...Array(5)].map((_, i) => <UserRowSkeleton key={i} />)}
                        {!usersIsLoading && (!users || users.length === 0) && <TableRow className="border-[var(--vv-border-soft)]"><TableCell colSpan={3} className="h-24 text-center text-[var(--text-muted)]">No users found.</TableCell></TableRow>}
                        {users?.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')).map(u => (
                            <UserRow
                                key={u.id}
                                user={u}
                                currentUser={user}
                                currentUserClaims={claims}
                                onRoleChange={handleRoleChange}
                                isUpdating={isUpdating === u.id}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </PageTransition>
    );
}
