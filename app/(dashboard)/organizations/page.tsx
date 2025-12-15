"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building2 } from "lucide-react";

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
    fetchOrganizations,
    deleteOrganization,
} from "@/store/slices/organizationSlice";
import { AddOrganizationDialog } from "@/components/organizations/add-organization-dialog";
import { EditOrganizationDialog } from "@/components/organizations/edit-organization-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { Organization } from "@/lib/types";

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "INACTIVE":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function OrganizationsPage() {
    const dispatch = useAppDispatch();
    const { organizations, isLoading, meta } = useAppSelector(
        (state) => state.organizations
    );
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
    const pageSize = 10;

    // Fetch organizations with pagination
    useEffect(() => {
        if (user) {
            dispatch(fetchOrganizations({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
        }
    }, [dispatch, currentPage, pageSize, searchTerm, user]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDelete = async () => {
        if (deleteOrg) {
            await dispatch(deleteOrganization(deleteOrg.id));
            dispatch(fetchOrganizations({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
            setDeleteOrg(null);
        }
    };

    const refreshOrganizations = () => {
        dispatch(fetchOrganizations({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
    };

    // Ensure organizations is always an array
    const orgList = Array.isArray(organizations) ? organizations : [];

    return (
        <ProtectedPage module="ORGANIZATIONS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Organizations
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your organizations
                        </p>
                    </div>
                    <PermissionGate module="ORGANIZATIONS" action="CREATE">
                        <AddOrganizationDialog
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Organization
                                </Button>
                            }
                            onSuccess={refreshOrganizations}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>All Organizations</CardTitle>
                                <CardDescription>
                                    {(meta?.total ?? 0) > 0
                                        ? `Showing ${orgList.length} of ${meta?.total ?? 0} organizations`
                                        : "A list of all organizations in your system"}
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={5} columns={3} />
                        ) : orgList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No organizations found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first organization to get started
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
                                                    Industry
                                                </TableHead>
                                                <TableHead className="hidden lg:table-cell">
                                                    Owner Email
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orgList.map((org) => (
                                                <TableRow key={org.id}>
                                                    <TableCell className="font-medium">{org.name}</TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {org.industryType}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        {org.ownerEmail}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                org.status
                                                            )}`}
                                                        >
                                                            {org.status}
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
                                                                <DropdownMenuItem onClick={() => setEditingOrg(org)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleteOrg(org)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
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
                                            ? "No organizations found"
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

                {editingOrg && (
                    <EditOrganizationDialog
                        organization={editingOrg}
                        open={!!editingOrg}
                        onOpenChange={(open) => !open && setEditingOrg(null)}
                        onSuccess={refreshOrganizations}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deleteOrg}
                    onOpenChange={(open) => !open && setDeleteOrg(null)}
                    title="Delete Organization"
                    description={`Are you sure you want to delete "${deleteOrg?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
