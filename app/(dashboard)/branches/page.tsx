"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, GitBranch } from "lucide-react";

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
import {
    fetchBranches,
    deleteBranch,
} from "@/store/slices/branchSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { AddBranchDialog } from "@/components/branches/add-branch-dialog";
import { EditBranchDialog } from "@/components/branches/edit-branch-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { isBranchManager, canUpdate, canDelete } from "@/lib/rbac";
import { useAutoSelectWithAll } from "@/components/ui/auto-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Branch } from "@/lib/types";

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "INACTIVE":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function BranchesPage() {
    const dispatch = useAppDispatch();
    const { branches, isLoading, meta } = useAppSelector((state) => state.branches);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const userRole = user?.role;

    // Fetch organizations only once on mount
    useEffect(() => {
        if (user) {
            dispatch(fetchOrganizations());
        }
    }, [dispatch, user]);

    // Auto-select organization if only one available
    const { shouldDisable: disableOrgFilter } = useAutoSelectWithAll(
        Array.isArray(organizations) ? organizations : [],
        selectedOrgFilter,
        setSelectedOrgFilter
    );

    // Fetch branches with pagination
    useEffect(() => {
        if (user) {
            dispatch(fetchBranches({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
                orgId: selectedOrgFilter !== "all" ? selectedOrgFilter : undefined,
            }));
        }
    }, [user, selectedOrgFilter, currentPage, pageSize, searchTerm, dispatch]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedOrgFilter]);

    const handleDelete = async () => {
        if (deletingBranch) {
            await dispatch(deleteBranch(deletingBranch.id));
            refreshBranches();
            setDeletingBranch(null);
        }
    };

    const refreshBranches = () => {
        dispatch(fetchBranches({
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            orgId: selectedOrgFilter !== "all" ? selectedOrgFilter : undefined,
        }));
    };

    const getOrganizationName = (orgId: string) => {
        const orgList = Array.isArray(organizations) ? organizations : [];
        const org = orgList.find((o) => o.id === orgId);
        return org?.name || "Unknown";
    };

    // Ensure branches is always an array
    const branchList = Array.isArray(branches) ? branches : [];

    // Filter branches for BRANCH_MANAGER (own branch only)
    const visibleBranches = isBranchManager(userRole) && user?.branchId
        ? branchList.filter(b => b.id === user.branchId)
        : branchList;

    return (
        <ProtectedPage module="BRANCHES">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Branches
                        </h1>
                        <p className="text-muted-foreground">
                            Manage organization branches
                        </p>
                    </div>
                    <PermissionGate module="BRANCHES" action="CREATE">
                        <AddBranchDialog
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Branch
                                </Button>
                            }
                            onSuccess={refreshBranches}
                            defaultOrgId={selectedOrgFilter !== "all" ? selectedOrgFilter : undefined}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>All Branches</CardTitle>
                                <CardDescription>
                                    {(meta?.total ?? 0) > 0
                                        ? `Showing ${visibleBranches.length} of ${meta?.total ?? 0} branches`
                                        : "A list of all branches across organizations"}
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
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search branches..."
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
                            <div className="flex items-center justify-center py-10">
                                <div className="text-muted-foreground">Loading...</div>
                            </div>
                        ) : visibleBranches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No branches found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first branch to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden md:table-cell">
                                                    Organization
                                                </TableHead>
                                                <TableHead className="hidden lg:table-cell">
                                                    Address
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleBranches.map((branch) => (
                                                <TableRow key={branch.id}>
                                                    <TableCell className="font-medium">
                                                        {branch.name}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {getOrganizationName(branch.orgId)}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        {branch.address}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                branch.status
                                                            )}`}
                                                        >
                                                            {branch.status || "ACTIVE"}
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
                                                                {canUpdate(userRole, "BRANCHES") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setEditingBranch(branch)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete(userRole, "BRANCHES") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingBranch(branch)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
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

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        {(meta?.total ?? 0) === 0
                                            ? "No branches found"
                                            : `Page ${currentPage} of ${meta?.totalPages ?? 1}`}
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
                                            disabled={isLoading || (meta?.totalPages ?? 1) <= 1 || currentPage >= (meta?.totalPages ?? 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {editingBranch && (
                    <EditBranchDialog
                        branch={editingBranch}
                        open={!!editingBranch}
                        onOpenChange={(open) => !open && setEditingBranch(null)}
                        onSuccess={refreshBranches}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingBranch}
                    onOpenChange={(open) => !open && setDeletingBranch(null)}
                    title="Delete Branch"
                    description={`Are you sure you want to delete "${deletingBranch?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
