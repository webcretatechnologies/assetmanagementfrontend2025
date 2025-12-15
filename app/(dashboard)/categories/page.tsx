"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Tags } from "lucide-react";

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
import { fetchCategories, deleteCategory, clearCategories } from "@/store/slices/categorySlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { EditCategoryDialog } from "@/components/categories/edit-category-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { canUpdate, canDelete } from "@/lib/rbac";
import { useAutoSelect } from "@/components/ui/auto-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { Category } from "@/lib/types";

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

export default function CategoriesPage() {
    const dispatch = useAppDispatch();
    const { categories, isLoading, meta } = useAppSelector((state) => state.categories);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const userRole = user?.role;

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const categoryList = Array.isArray(categories) ? categories : [];

    useEffect(() => {
        if (user) {
            dispatch(fetchOrganizations());
        }
    }, [dispatch, user]);

    // Auto-select organization if only one available
    const { shouldDisable: disableOrgSelect } = useAutoSelect(
        orgList,
        selectedOrgId,
        setSelectedOrgId
    );

    useEffect(() => {
        if (user && selectedOrgId) {
            dispatch(fetchCategories({
                organizationId: selectedOrgId,
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined
            }));
        } else {
            dispatch(clearCategories());
        }
    }, [user, selectedOrgId, currentPage, searchTerm, dispatch]);

    // Reset page when org or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedOrgId, searchTerm]);

    const handleDelete = async () => {
        if (deletingCategory) {
            await dispatch(deleteCategory({ id: deletingCategory.id, organizationId: deletingCategory.organizationId }));
            setDeletingCategory(null);
        }
    };

    const handleRefresh = () => {
        if (selectedOrgId) {
            dispatch(fetchCategories({
                organizationId: selectedOrgId,
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined
            }));
        }
    };

    return (
        <ProtectedPage module="CATEGORIES">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Manage categories for your organizations
                        </p>
                    </div>
                    <PermissionGate module="CATEGORIES" action="CREATE">
                        <AddCategoryDialog
                            trigger={
                                <Button disabled={!selectedOrgId}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            }
                            onSuccess={handleRefresh}
                            defaultOrgId={selectedOrgId}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>All Categories</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${categoryList.length} of ${meta.total} categories`
                                        : "Select an organization to view its categories"}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select
                                    value={selectedOrgId}
                                    onValueChange={setSelectedOrgId}
                                    disabled={disableOrgSelect}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orgList.map((org) => (
                                            <SelectItem key={org.id} value={org.id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search categories..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={!selectedOrgId}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedOrgId ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Tags className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">Select an organization to view categories</p>
                            </div>
                        ) : isLoading ? (
                            <TableSkeleton rows={5} columns={5} />
                        ) : categoryList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Tags className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No categories found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first category to get started
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="hidden md:table-cell">Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categoryList.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium">
                                                    {category.name}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {category.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                            category.status
                                                        )}`}
                                                    >
                                                        {category.status}
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
                                                            {canUpdate(userRole, "CATEGORIES") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setEditingCategory(category)}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canDelete(userRole, "CATEGORIES") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeletingCategory(category)}
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
                                {(meta?.totalPages ?? 1) > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            {isLoading
                                                ? "Loading..."
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
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {editingCategory && (
                    <EditCategoryDialog
                        category={editingCategory}
                        open={!!editingCategory}
                        onOpenChange={(open) => !open && setEditingCategory(null)}
                        onSuccess={handleRefresh}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingCategory}
                    onOpenChange={(open) => !open && setDeletingCategory(null)}
                    title="Delete Category"
                    description={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
