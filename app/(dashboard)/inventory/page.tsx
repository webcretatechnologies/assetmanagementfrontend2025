"use client";

import { useEffect, useState } from "react";
import { Warehouse, Plus, ArrowRightLeft, Search, Upload, Download, Loader2, History, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInventory, clearInventory } from "@/store/slices/inventorySlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { ProtectedPage } from "@/components/rbac";
import { isInventoryOperator, isBranchManager, isOrgAdmin, canTransferInventory } from "@/lib/rbac";
import { useAutoSelect } from "@/components/ui/auto-select";
import { AddInventoryDialog } from "@/components/inventory/add-inventory-dialog";
import { TransferInventoryDialog } from "@/components/inventory/transfer-inventory-dialog";
import { ImportInventoryDialog } from "@/components/inventory/import-inventory-dialog";
import { ImportHistoryDialog } from "@/components/inventory/import-history-dialog";
import { RestoreInventoryDialog } from "@/components/inventory/restore-inventory-dialog";
import { exportInventory } from "@/lib/api/inventory";
import { setIsExporting } from "@/store/slices/inventorySlice";
import type { InventoryStatus, InventoryItem } from "@/lib/types";
import { toast } from "sonner";

const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
        case "AVAILABLE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "ASSIGNED":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "IN_TRANSIT":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "DAMAGED":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        case "DISPOSED":
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        case "WRITTEN_OFF":
            return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function InventoryPage() {
    const dispatch = useAppDispatch();
    const { items, isLoading, meta, isExporting } = useAppSelector((state) => state.inventory);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { user } = useAppSelector((state) => state.auth);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    // Restore dialog state
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState<InventoryItem | null>(null);

    const userRole = user?.role;
    const isScopedUser = isInventoryOperator(userRole) || isBranchManager(userRole);
    const isOrgScopedUser = isOrgAdmin(userRole);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];
    const itemList = Array.isArray(items) ? items : [];

    useEffect(() => {
        dispatch(fetchOrganizations());
    }, [dispatch]);

    // Auto-select organization for scoped users
    useEffect(() => {
        if ((isScopedUser || isOrgScopedUser) && user?.orgId && !selectedOrgId) {
            setSelectedOrgId(user.orgId);
        }
    }, [isScopedUser, isOrgScopedUser, user?.orgId, selectedOrgId]);

    // Auto-select organization if only one available (for admins)
    const { shouldDisable: disableOrgSelectAuto } = useAutoSelect(
        orgList,
        selectedOrgId,
        setSelectedOrgId
    );

    // Disable org dropdown for org-scoped or branch-scoped users
    const disableOrgSelect = isScopedUser || isOrgScopedUser || disableOrgSelectAuto;

    useEffect(() => {
        if (user && selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
            if (!isScopedUser) {
                setSelectedBranchId("all");
            }
        }
    }, [selectedOrgId, dispatch, isScopedUser, user]);

    // Auto-select branch for branch-scoped users
    useEffect(() => {
        if (isScopedUser && user?.branchId && selectedBranchId === "all") {
            setSelectedBranchId(user.branchId);
        }
    }, [isScopedUser, user?.branchId, selectedBranchId]);

    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");

    // Fetch inventory when filters change
    useEffect(() => {
        if (selectedOrgId) {
            dispatch(
                fetchInventory({
                    organizationId: selectedOrgId,
                    branchId: selectedBranchId !== "all" ? selectedBranchId : undefined,
                    status: statusFilter !== "all" ? (statusFilter as InventoryStatus) : undefined,
                    search: searchTerm || undefined,
                    page: currentPage,
                    limit: 10,
                })
            );
        } else {
            dispatch(clearInventory());
        }
    }, [selectedOrgId, selectedBranchId, statusFilter, searchTerm, currentPage, dispatch]);

    const refreshInventory = () => {
        if (selectedOrgId) {
            dispatch(
                fetchInventory({
                    organizationId: selectedOrgId,
                    branchId: selectedBranchId !== "all" ? selectedBranchId : undefined,
                    status: statusFilter !== "all" ? (statusFilter as InventoryStatus) : undefined,
                    search: searchTerm || undefined,
                    page: currentPage,
                    limit: 10,
                })
            );
        }
    };

    return (
        <ProtectedPage module="INVENTORY">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Warehouse className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                                Inventory
                            </h1>
                            <p className="text-muted-foreground">
                                Manage stock levels across branches
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {selectedOrgId && (
                            <>
                                <AddInventoryDialog
                                    defaultOrgId={selectedOrgId}
                                    defaultBranchId={selectedBranchId !== "all" ? selectedBranchId : undefined}
                                    onSuccess={refreshInventory}
                                    trigger={
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Stock
                                        </Button>
                                    }
                                />
                                <ImportInventoryDialog
                                    defaultOrgId={selectedOrgId}
                                    defaultBranchId={selectedBranchId !== "all" ? selectedBranchId : undefined}
                                    onSuccess={refreshInventory}
                                    trigger={
                                        <Button variant="outline">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                    }
                                />
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        dispatch(setIsExporting(true));
                                        try {
                                            await exportInventory({
                                                organizationId: selectedOrgId,
                                                branchId: selectedBranchId !== "all" ? selectedBranchId : undefined,
                                                status: statusFilter !== "all" ? (statusFilter as InventoryStatus) : undefined,
                                                search: searchTerm || undefined,
                                            });
                                            toast.success("Inventory exported successfully");
                                        } catch {
                                            // Error handled by API interceptor
                                        } finally {
                                            dispatch(setIsExporting(false));
                                        }
                                    }}
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export
                                </Button>
                                {canTransferInventory(userRole) && (
                                    <TransferInventoryDialog
                                        organizationId={selectedOrgId}
                                        onSuccess={refreshInventory}
                                        trigger={
                                            <Button variant="outline">
                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                Transfer
                                            </Button>
                                        }
                                    />
                                )}
                                <ImportHistoryDialog
                                    organizationId={selectedOrgId}
                                    onRefresh={refreshInventory}
                                    trigger={
                                        <Button variant="outline" size="icon" title="Import History">
                                            <History className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            </>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>Stock Items</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${items.length} of ${meta.total} items`
                                        : "View and manage inventory across all branches"}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
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
                                    value={selectedBranchId}
                                    onValueChange={setSelectedBranchId}
                                    disabled={!selectedOrgId || isScopedUser}
                                >
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {activeBranches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-36">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="AVAILABLE">Available</SelectItem>
                                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                                        <SelectItem value="DISPOSED">Disposed</SelectItem>
                                        <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedOrgId ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Select an organization to view inventory
                            </div>
                        ) : isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading inventory...
                            </div>
                        ) : itemList.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No inventory items found
                            </div>
                        ) : (() => {
                            const hasWrittenOffItems = itemList.some(item => item.status === "WRITTEN_OFF");
                            return (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Branch</TableHead>
                                                    <TableHead>Serial Number</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                    <TableHead>Warranty Expiry</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    {hasWrittenOffItems && (
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemList.map((item, index) => (
                                                    <TableRow key={`${item.id}-${index}`}>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {item.product?.name || "Unknown Product"}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {item.product?.sku}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.branch?.name || "Unknown Branch"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.serialNumber || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.warrantyExpiryDate ? (
                                                                <span
                                                                    className={
                                                                        new Date(item.warrantyExpiryDate) < new Date()
                                                                            ? "text-red-600 font-medium"
                                                                            : new Date(item.warrantyExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                                                ? "text-yellow-600"
                                                                                : ""
                                                                    }
                                                                >
                                                                    {new Date(item.warrantyExpiryDate).toLocaleDateString()}
                                                                </span>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={getStatusColor(item.status)}
                                                            >
                                                                {item.status === "WRITTEN_OFF" ? "Written Off" : item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        {hasWrittenOffItems && (
                                                            <TableCell className="text-right">
                                                                {item.status === "WRITTEN_OFF" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setItemToRestore(item);
                                                                            setRestoreDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <RotateCcw className="mr-1 h-4 w-4" />
                                                                        Restore
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {meta.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {itemList.length} of {meta.total} items
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
                                                    onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                                                    disabled={currentPage === meta.totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>

            {/* Restore Dialog */}
            <RestoreInventoryDialog
                item={itemToRestore}
                open={restoreDialogOpen}
                onOpenChange={setRestoreDialogOpen}
                onSuccess={refreshInventory}
            />
        </ProtectedPage>
    );
}
