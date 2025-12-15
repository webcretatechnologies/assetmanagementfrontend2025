"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Package } from "lucide-react";

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
import { fetchProducts, deleteProduct, clearProducts } from "@/store/slices/productSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchCategories, clearCategories } from "@/store/slices/categorySlice";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { EditProductDialog } from "@/components/products/edit-product-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { canUpdate, canDelete, isViewOnly } from "@/lib/rbac";
import { useAutoSelect, useAutoSelectWithAll } from "@/components/ui/auto-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Product } from "@/lib/types";

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

const getTypeColor = (type: string) => {
    switch (type) {
        case "ASSET":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "CONSUMABLE":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function AssetsPage() {
    const dispatch = useAppDispatch();
    const { products, isLoading, meta } = useAppSelector((state) => state.products);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { categories } = useAppSelector((state) => state.categories);
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const userRole = user?.role;
    const viewOnly = isViewOnly(userRole, "PRODUCTS");

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const categoryList = Array.isArray(categories) ? categories : [];
    const productList = Array.isArray(products) ? products : [];

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
            dispatch(fetchCategories({ organizationId: selectedOrgId }));
            setSelectedCategoryId("all");
        } else {
            dispatch(clearCategories());
        }
    }, [user, selectedOrgId, dispatch]);

    // Auto-select category if only one available
    const activeCategories = categoryList.filter((c) => c.status === "ACTIVE");
    const { shouldDisable: disableCategorySelect } = useAutoSelectWithAll(
        activeCategories,
        selectedCategoryId,
        setSelectedCategoryId
    );

    useEffect(() => {
        if (user && selectedOrgId) {
            dispatch(
                fetchProducts({
                    organizationId: selectedOrgId,
                    page: currentPage,
                    limit: 20,
                    search: searchTerm || undefined,
                    categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
                })
            );
        } else {
            dispatch(clearProducts());
        }
    }, [user, selectedOrgId, selectedCategoryId, currentPage, searchTerm, dispatch]);

    const handleDelete = async () => {
        if (deletingProduct) {
            await dispatch(
                deleteProduct({ id: deletingProduct.id, organizationId: deletingProduct.organizationId })
            );
            setDeletingProduct(null);
        }
    };

    const handleRefresh = () => {
        if (selectedOrgId) {
            dispatch(
                fetchProducts({
                    organizationId: selectedOrgId,
                    page: currentPage,
                    limit: 20,
                    search: searchTerm || undefined,
                    categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
                })
            );
        }
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    return (
        <ProtectedPage module="PRODUCTS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Assets</h1>
                        <p className="text-muted-foreground">
                            Manage products and assets for your organizations
                        </p>
                    </div>
                    <PermissionGate module="PRODUCTS" action="CREATE">
                        <AddProductDialog
                            trigger={
                                <Button disabled={!selectedOrgId}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Product
                                </Button>
                            }
                            onSuccess={handleRefresh}
                            defaultOrgId={selectedOrgId}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>All Products</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${productList.length} of ${meta.total} products`
                                        : "Select an organization to view its products"}
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
                                <Select
                                    value={selectedCategoryId}
                                    onValueChange={setSelectedCategoryId}
                                    disabled={!selectedOrgId || disableCategorySelect}
                                >
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All categories</SelectItem>
                                        {activeCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        disabled={!selectedOrgId}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedOrgId ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">
                                    Select an organization to view products
                                </p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="text-muted-foreground">Loading...</div>
                            </div>
                        ) : productList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No products found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first product to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                                <TableHead className="hidden lg:table-cell">Brand</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productList.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {product.sku}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                                        {product.category?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                        {product.brand || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(
                                                                product.productType
                                                            )}`}
                                                        >
                                                            {product.productType}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                product.status
                                                            )}`}
                                                        >
                                                            {product.status}
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
                                                                {canUpdate(userRole, "PRODUCTS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setEditingProduct(product)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete(userRole, "PRODUCTS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingProduct(product)}
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

                                {/* Pagination */}
                                {meta.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                                            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => p + 1)}
                                                disabled={currentPage >= meta.totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {editingProduct && (
                    <EditProductDialog
                        product={editingProduct}
                        open={!!editingProduct}
                        onOpenChange={(open) => !open && setEditingProduct(null)}
                        onSuccess={handleRefresh}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingProduct}
                    onOpenChange={(open) => !open && setDeletingProduct(null)}
                    title="Delete Product"
                    description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
