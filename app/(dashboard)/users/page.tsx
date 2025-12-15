"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, fetchUsersByOrg, deleteUser } from "@/store/slices/userSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { isBranchManager, canUpdate, canDelete } from "@/lib/rbac";
import { useAutoSelectWithAll } from "@/components/ui/auto-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { User } from "@/lib/types";

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "INVITED":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "DISABLED":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        ORG_ADMIN: "Org Admin",
        BRANCH_MANAGER: "Branch Manager",
        INVENTORY_OPERATOR: "Inventory Operator",
        SERVICE_TECHNICIAN: "Service Technician",
        EMPLOYEE: "Employee",
    };
    return labels[role] || role;
};

export default function UsersPage() {
    const dispatch = useAppDispatch();
    const { users, isLoading, meta } = useAppSelector((state) => state.users);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const userRole = currentUser?.role;

    // Fetch organizations only once on mount
    useEffect(() => {
        if (currentUser) {
            dispatch(fetchOrganizations());
        }
    }, [dispatch, currentUser]);

    // Auto-select organization if only one available
    const { shouldDisable: disableOrgFilter } = useAutoSelectWithAll(
        organizations,
        selectedOrgFilter,
        setSelectedOrgFilter
    );

    // Fetch users based on org filter and pagination
    useEffect(() => {
        if (!currentUser) return;
        const params = {
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            role: selectedRoleFilter !== "all" ? selectedRoleFilter : undefined,
            status: selectedStatusFilter !== "all" ? selectedStatusFilter : undefined,
        };
        if (selectedOrgFilter === "all") {
            dispatch(fetchUsers(params));
        } else {
            dispatch(fetchUsersByOrg({ orgId: selectedOrgFilter, ...params }));
        }
    }, [currentUser, selectedOrgFilter, selectedRoleFilter, selectedStatusFilter, searchTerm, currentPage, dispatch]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedOrgFilter, selectedRoleFilter, selectedStatusFilter, searchTerm]);

    const handleDelete = async () => {
        if (deletingUser) {
            await dispatch(deleteUser(deletingUser.id));
            setDeletingUser(null);
        }
    };

    const getOrganizationName = (orgId: string) => {
        const org = organizations.find((o) => o.id === orgId);
        return org?.name || "Unknown";
    };

    // Ensure users is always an array
    const userList = Array.isArray(users) ? users : [];

    // Filter users for BRANCH_MANAGER (own branch only) - client-side filter for visibility
    const filteredUsers = isBranchManager(userRole) && currentUser?.branchId
        ? userList.filter(u => u.branchId === currentUser.branchId)
        : userList;

    const handleRefresh = () => {
        const params = {
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            role: selectedRoleFilter !== "all" ? selectedRoleFilter : undefined,
            status: selectedStatusFilter !== "all" ? selectedStatusFilter : undefined,
        };
        if (selectedOrgFilter === "all") {
            dispatch(fetchUsers(params));
        } else {
            dispatch(fetchUsersByOrg({ orgId: selectedOrgFilter, ...params }));
        }
    };

    return (
        <ProtectedPage module="USERS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Users
                        </h1>
                        <p className="text-muted-foreground">
                            Manage users across organizations
                        </p>
                    </div>
                    <PermissionGate module="USERS" action="CREATE">
                        <AddUserDialog
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            }
                            onSuccess={handleRefresh}
                            defaultOrgId={selectedOrgFilter !== "all" ? selectedOrgFilter : undefined}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>All Users</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${filteredUsers.length} of ${meta.total} users`
                                        : "A list of all users across organizations"
                                    }
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select
                                    value={selectedOrgFilter}
                                    onValueChange={setSelectedOrgFilter}
                                    disabled={disableOrgFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Filter by organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Organizations</SelectItem>
                                        {(Array.isArray(organizations) ? organizations : []).map((org) => (
                                            <SelectItem key={org.id} value={org.id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={selectedRoleFilter}
                                    onValueChange={setSelectedRoleFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                        <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
                                        <SelectItem value="BRANCH_MANAGER">Branch Manager</SelectItem>
                                        <SelectItem value="INVENTORY_OPERATOR">Inventory Operator</SelectItem>
                                        <SelectItem value="SERVICE_TECHNICIAN">Service Technician</SelectItem>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={selectedStatusFilter}
                                    onValueChange={setSelectedStatusFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-36">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="INVITED">Invited</SelectItem>
                                        <SelectItem value="DISABLED">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={5} columns={7} />
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No users found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first user to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                                <TableHead className="hidden lg:table-cell">
                                                    Organization
                                                </TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">
                                                        {user.firstName} {user.lastName}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {user.email}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        {getOrganizationName(user.orgId)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {getRoleLabel(user.role)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                user.status
                                                            )}`}
                                                        >
                                                            {user.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {canUpdate(userRole, "USERS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setEditingUser(user)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete(userRole, "USERS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingUser(user)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Disable
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination - always show for consistency */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        {isLoading
                                            ? "Loading..."
                                            : `Page ${currentPage} of ${meta.totalPages || 1}`}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage <= 1 || isLoading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            disabled={
                                                isLoading ||
                                                meta.totalPages <= 1 ||
                                                currentPage >= meta.totalPages ||
                                                filteredUsers.length < pageSize
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {editingUser && (
                    <EditUserDialog
                        user={editingUser}
                        open={!!editingUser}
                        onOpenChange={(open) => !open && setEditingUser(null)}
                        onSuccess={handleRefresh}
                    />
                )}

                {/* Disable User Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingUser}
                    onOpenChange={(open) => !open && setDeletingUser(null)}
                    title="Disable User"
                    description={`Are you sure you want to disable "${deletingUser?.firstName} ${deletingUser?.lastName}"? The user will no longer be able to access the system.`}
                    confirmText="Disable"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
