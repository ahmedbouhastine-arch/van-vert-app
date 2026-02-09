'use client';
import { useState, useMemo } from "react";
import type { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type User } from "firebase/auth";

type UserWithProfile = UserProfile & { id: string; photoURL?: string; };

function UserRow({ 
    user, 
    currentUser,
    currentUserClaims,
    onRoleChange
}: { 
    user: UserWithProfile, 
    currentUser: User,
    currentUserClaims: any,
    onRoleChange: (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => void
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
                        <Button onClick={handleUpdate} disabled={selectedRole === user.role}>Update Role</Button>
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
    
    const mockUsers: UserWithProfile[] = useMemo(() => [
        {
            id: currentUser.uid,
            displayName: currentUser.displayName || 'Head Admin',
            email: currentUser.email || 'head-admin@test.va',
            role: 'head-admin',
            photoURL: currentUser.photoURL || 'https://picsum.photos/seed/104/200/200',
            createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 }
        },
        {
            id: 'mock-admin-id',
            displayName: 'Adam Admin',
            email: 'adam.admin@test.va',
            role: 'admin',
            photoURL: 'https://picsum.photos/seed/103/200/200',
            createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 }
        },
        {
            id: 'mock-reviewer-id',
            displayName: 'Sarah Reviewer',
            email: 'sarah.reviewer@test.va',
            role: 'reviewer',
            photoURL: 'https://picsum.photos/seed/102/200/200',
            createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 }
        },
        {
            id: 'mock-user-id',
            displayName: 'John Pilot',
            email: 'john.pilot@example.com',
            role: 'user',
            photoURL: 'https://picsum.photos/seed/101/200/200',
            createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 }
        }
    ], [currentUser]);
    
    const [users, setUsers] = useState<UserWithProfile[]>(mockUsers);
    const loading = false;

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'head-admin' | 'reviewer') => {
        setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        
        toast({
            title: "Mock Data",
            description: `This is for demonstration and is not saved to the database.`,
        });
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
                            <UserRow key={user.id} user={user} currentUser={currentUser} currentUserClaims={currentUserClaims} onRoleChange={handleRoleChange} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
