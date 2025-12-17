"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Truck, Phone, Mail, Building } from "lucide-react";

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
    fetchVendors,
    deleteVendor,
} from "@/store/slices/vendorSlice";
import { AddVendorDialog } from "@/components/vendors/add-vendor-dialog";
import { EditVendorDialog } from "@/components/vendors/edit-vendor-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { canUpdate, canDelete } from "@/lib/rbac";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { Vendor, VendorType, VendorCategory, VendorStatus } from "@/lib/types";

const getStatusColor = (status: VendorStatus) => {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "INACTIVE":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

const getVendorTypeColor = (type: VendorType) => {
    switch (type) {
        case "SUPPLIER":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "SERVICE_PROVIDER":
            return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

const VENDOR_CATEGORIES: { value: VendorCategory; label: string }[] = [
    { value: "IT_HARDWARE", label: "IT Hardware" },
    { value: "HVAC", label: "HVAC" },
    { value: "ELECTRICAL", label: "Electrical" },
    { value: "PLUMBING", label: "Plumbing" },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "FURNITURE", label: "Furniture" },
    { value: "SECURITY", label: "Security" },
    { value: "ELECTRONICS", label: "Electronics" },
    { value: "MACHINERY", label: "Machinery" },
    { value: "VEHICLES", label: "Vehicles" },
    { value: "CLEANING", label: "Cleaning" },
    { value: "GENERAL_MAINTENANCE", label: "General Maintenance" },
    { value: "OTHER", label: "Other" },
];

const getCategoryLabel = (category: VendorCategory) => {
    return VENDOR_CATEGORIES.find(c => c.value === category)?.label || category;
};

export default function VendorsPage() {
    const dispatch = useAppDispatch();
    const { vendors, isLoading, meta } = useAppSelector((state) => state.vendors);
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const userRole = user?.role;

    const refreshVendors = useCallback(() => {
        dispatch(fetchVendors({
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            type: typeFilter !== "all" ? typeFilter as VendorType : undefined,
            category: categoryFilter !== "all" ? categoryFilter as VendorCategory : undefined,
            status: statusFilter !== "all" ? statusFilter as VendorStatus : undefined,
        }));
    }, [dispatch, currentPage, pageSize, searchTerm, typeFilter, categoryFilter, statusFilter]);

    // Fetch vendors with pagination and filters
    useEffect(() => {
        if (user) {
            refreshVendors();
        }
    }, [user, refreshVendors]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, categoryFilter, statusFilter]);

    const handleDelete = async () => {
        if (deletingVendor) {
            await dispatch(deleteVendor(deletingVendor.id));
            refreshVendors();
            setDeletingVendor(null);
        }
    };

    const vendorList = Array.isArray(vendors) ? vendors : [];

    return (
        <ProtectedPage module="VENDORS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Vendors
                        </h1>
                        <p className="text-muted-foreground">
                            Manage suppliers and service providers
                        </p>
                    </div>
                    <PermissionGate module="VENDORS" action="CREATE">
                        <AddVendorDialog
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Vendor
                                </Button>
                            }
                            onSuccess={refreshVendors}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>All Vendors</CardTitle>
                                <CardDescription>
                                    {(meta?.total ?? 0) > 0
                                        ? `Showing ${vendorList.length} of ${meta?.total ?? 0} vendors`
                                        : "A list of all vendors in your organization"}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                                <Select
                                    value={typeFilter}
                                    onValueChange={setTypeFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Vendor Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="SUPPLIER">Supplier</SelectItem>
                                        <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-44">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {VENDOR_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search vendors..."
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
                            <TableSkeleton rows={5} columns={6} />
                        ) : vendorList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No vendors found</p>
                                <p className="text-sm text-muted-foreground">
                                    Add your first vendor to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vendorList.map((vendor) => (
                                                <TableRow key={vendor.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Building className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{vendor.name}</div>
                                                                {vendor.code && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {vendor.code}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVendorTypeColor(
                                                                vendor.vendorType
                                                            )}`}
                                                        >
                                                            {vendor.vendorType === "SUPPLIER" ? "Supplier" : "Service Provider"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {getCategoryLabel(vendor.category)}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-col gap-1 text-sm">
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {vendor.phone}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Mail className="h-3 w-3" />
                                                                {vendor.email}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                vendor.status
                                                            )}`}
                                                        >
                                                            {vendor.status}
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
                                                                {canUpdate(userRole, "VENDORS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setEditingVendor(vendor)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete(userRole, "VENDORS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingVendor(vendor)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Deactivate
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
                                            ? "No vendors found"
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

                {editingVendor && (
                    <EditVendorDialog
                        vendor={editingVendor}
                        open={!!editingVendor}
                        onOpenChange={(open) => !open && setEditingVendor(null)}
                        onSuccess={refreshVendors}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingVendor}
                    onOpenChange={(open) => !open && setDeletingVendor(null)}
                    title="Deactivate Vendor"
                    description={`Are you sure you want to deactivate "${deletingVendor?.name}"? The vendor will be marked as inactive and hidden from active lists. Historical records will be preserved.`}
                    confirmText="Deactivate"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
