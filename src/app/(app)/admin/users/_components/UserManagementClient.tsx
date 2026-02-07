'use client';
import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";

type UserWithProfile = UserProfile & { id: string; photoURL?: string; };

function UserRow({ user, currentUser, onRoleChange }: { user: UserWithProfile, currentUser: User, onRoleChange: (userId: string, role: 'user' | 'admin' | 'head-admin' | 'reviewer') => void }) {
    const [selectedRole, setSelectedRole] = useState(user.role);

    const handleUpdate = () => {
        onRoleChange(user.id, selectedRole);
    };
    
    const isCurrentUser = user.id === currentUser.uid;

    // A user cannot change their own role.
    const canChangeRole = !isCurrentUser;

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
            <TableCell className="capitalize">{user.role.replace(/-/g, ' ')}</TableCell>
            <TableCell>
                {canChangeRole ? (
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="head-admin">Head Admin</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <span className="text-sm text-muted-foreground">Cannot change own role</span>
                )}
            </TableCell>
            <TableCell className="text-right">
                {canChangeRole && (
                     <Button onClick={handleUpdate} disabled={selectedRole === user.role}>Update Role</Button>
                )}
            </TableCell>
        </TableRow>
    );
}

export function UserManagementClient({ currentUser }: { currentUser: User }) {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);
    const { data: users, loading } = useCollection<UserWithProfile>(usersQuery);
    const { toast } = useToast();

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => {
        if (!firestore) return;
        const userRef = doc(firestore, "users", userId);
        try {
            await updateDoc(userRef, { role: newRole });
            toast({
                title: "Success",
                description: `User role has been updated to ${newRole}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update failed',
                description: `Could not update role. Error: ${error.message}`,
            });
        }
    };
    
    return (
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
                            <TableHead>Current Role</TableHead>
                            <TableHead>New Role</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={4} className="text-center">Loading users...</TableCell></TableRow>}
                        {!loading && users?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No users found.</TableCell></TableRow>}
                        {users?.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')).map(user => (
                            <UserRow key={user.id} user={user} currentUser={currentUser} onRoleChange={handleRoleChange} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
