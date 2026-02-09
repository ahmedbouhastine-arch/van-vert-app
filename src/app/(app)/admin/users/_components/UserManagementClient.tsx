'use client';
import { useState } from "react";
import type { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";
import { Loader2 } from "lucide-react";

type UserWithProfile = UserProfile & { id: string; photoURL?: string; };

function UserRow({ 
    user, 
    currentUser,
    currentUserClaims,
    onRoleChange,
    isUpdating
}: { 
    user: UserWithProfile, 
    currentUser: User,
    currentUserClaims: any,
    onRoleChange: (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => void,
    isUpdating: boolean
}) {
    const [selectedRole, setSelectedRole] = useState(user.role);

    const handleUpdate = () => {
        onRoleChange(user.id, selectedRole);
    };
    
    const isCurrentUser = user.id === currentUser.uid || user.email === currentUser.email;

    // Determines if the current user can modify the target user at all
    const canPerformActions = (() => {
        if (isCurrentUser) return false; // Can't edit self.
        const currentUserRole = currentUserClaims?.role;
        if (currentUserRole === 'head-admin') return true; // Head admin can edit anyone.
        if (currentUserRole === 'admin') {
            return user.role !== 'head-admin'; // Admins cannot edit head-admins.
        }
        return false; // Reviewers and users can't perform actions.
    })();

    // Determines if an admin is trying to promote someone to head-admin
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
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
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
                        {user.role.replace(/-/g, ' ')}
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

export function UserManagementClient({ currentUser, currentUserClaims }: { currentUser: User, currentUserClaims: any }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const mockUsers: UserWithProfile[] = [
        { id: 'user-head-admin', displayName: 'Admin Head', email: 'head-admin@test.va', role: 'head-admin', photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
        { id: 'user-admin', displayName: 'Jane Doe', email: 'jane.doe@test.va', role: 'admin', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
        { id: 'user-reviewer', displayName: 'Reviewer Person', email: 'reviewer@test.va', role: 'reviewer', photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
        { id: 'user-regular', displayName: 'John Pilot', email: 'john.pilot@example.com', role: 'user', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
    ];
    
    const [users, setUsers] = useState<UserWithProfile[]>(mockUsers);
    const loading = false;

    const handleRoleChange = (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => {
        setIsUpdating(userId);
        // Simulate an API call
        setTimeout(() => {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast({
                title: "Role Updated (Mock)",
                description: `User role has been changed to ${newRole}. This change is for demonstration and will not be saved.`,
            });
            setIsUpdating(null);
        }, 1000);
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
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                currentUser={currentUser} 
                                currentUserClaims={currentUserClaims} 
                                onRoleChange={handleRoleChange} 
                                isUpdating={isUpdating === user.id}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
