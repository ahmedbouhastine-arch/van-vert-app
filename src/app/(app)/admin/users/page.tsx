
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import React, { useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { UserProfile } from "@/types";
import { collection, doc, updateDoc, type CollectionReference } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";
import { Loader2 } from "lucide-react";


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
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />}
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {canPerformActions ? (
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
                        <SelectTrigger className="w-[180px]">
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
                            <div className="capitalize w-[180px] px-3 py-2 text-sm">
                                {(user.role || 'user').replace(/-/g, ' ')}
                            </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                {canPerformActions ? (
                    <div className="flex items-center justify-end gap-2">
                        <Button onClick={handleUpdate} disabled={selectedRole === user.role || isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Role
                        </Button>
                    </div>
                ) : isCurrentUser ? (
                     <span className="text-sm text-muted-foreground pr-4">Cannot edit self</span>
                ) : (
                    <span className="text-sm text-muted-foreground pr-4">Permission Denied</span>
                )
                }
            </TableCell>
        </TableRow>
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
        if (!firestore) return;
        setIsUpdating(userId);
        const userRef = doc(firestore, 'users', userId);

        updateDoc(userRef, { role: newRole })
            .then(() => {
                toast({
                    title: "Role Updated",
                    description: `User role has been successfully changed to ${newRole}.`,
                });
            })
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: { role: newRole },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: "Update Failed",
                    description: "You may not have permission to perform this action.",
                });
            })
            .finally(() => {
                setIsUpdating(null);
            });
    };

    if (!user) {
        return <LoadingScreen />
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Promote or demote users to different roles.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View and manage user roles in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersIsLoading && <TableRow><TableCell colSpan={3} className="text-center h-24">Loading users...</TableCell></TableRow>}
                            {!usersIsLoading && (!users || users.length === 0) && <TableRow><TableCell colSpan={3} className="text-center h-24">No users found.</TableCell></TableRow>}
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
                </CardContent>
            </Card>
        </div>
    );
}
