'use client';
import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, deleteDoc } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

type UserWithProfile = UserProfile & { id: string; photoURL?: string; };

function UserRow({ 
    user, 
    currentUser, 
    onRoleChange, 
    onDeleteUser 
}: { 
    user: UserWithProfile, 
    currentUser: User, 
    onRoleChange: (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => void,
    onDeleteUser: (userId: string, displayName: string) => void
}) {
    const [selectedRole, setSelectedRole] = useState(user.role);

    const handleUpdate = () => {
        onRoleChange(user.id, selectedRole);
    };
    
    const isCurrentUser = user.id === currentUser.uid;
    const canPerformActions = !isCurrentUser;

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
                     <div className="capitalize w-[180px] px-3 py-2 text-sm">
                        {user.role.replace(/-/g, ' ')}
                     </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                {canPerformActions ? (
                    <div className="flex items-center justify-end gap-2">
                        <Button onClick={handleUpdate} disabled={selectedRole === user.role}>Update Role</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the user '{user.displayName}' from the user database, which may orphan some of their data. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteUser(user.id, user.displayName || '')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete User</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground pr-4">Cannot edit self</span>
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

    const handleDeleteUser = async (userId: string, displayName: string) => {
        if (!firestore) return;
        const userRef = doc(firestore, "users", userId);
        try {
            await deleteDoc(userRef);
            toast({
                title: "User Deleted",
                description: `'${displayName}' has been removed from the user list.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Delete failed',
                description: `Could not delete user. Error: ${error.message}`,
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
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={3} className="text-center">Loading users...</TableCell></TableRow>}
                        {!loading && users?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center h-24">No users found.</TableCell></TableRow>}
                        {users?.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')).map(user => (
                            <UserRow key={user.id} user={user} currentUser={currentUser} onRoleChange={handleRoleChange} onDeleteUser={handleDeleteUser} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
