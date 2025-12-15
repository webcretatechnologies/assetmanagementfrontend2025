"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ClipboardList, Eye } from "lucide-react";

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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBranchAssignments, clearAssignments } from "@/store/slices/assignmentSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { AssignAssetDialog } from "@/components/assignments/assign-asset-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { isInventoryOperator, isBranchManager, isEmployee } from "@/lib/rbac";
import { useAutoSelect } from "@/components/ui/auto-select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { AssetAssignment } from "@/lib/types";

const getStatusColor = (status: string) => {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "RETURNED":
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        case "PENDING_RETURN":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "IN_REPAIR":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function AssignmentsPage() {
    const dispatch = useAppDispatch();
    const { assignments, isLoading, meta } = useAppSelector((state) => state.assignments);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { user } = useAppSelector((state) => state.auth);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewAssignment, setViewAssignment] = useState<AssetAssignment | null>(null);

    const userRole = user?.role;
    // Include EMPLOYEE in scoped users - they can only see their branch's data
    const isScopedUser = isInventoryOperator(userRole) || isBranchManager(userRole) || isEmployee(userRole);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];
    const assignmentList = Array.isArray(assignments) ? assignments : [];

    useEffect(() => {
        if (user) {
            dispatch(fetchOrganizations());
        }
    }, [dispatch, user]);

    // Auto-select organization for scoped users (INVENTORY_OPERATOR, BRANCH_MANAGER)
    useEffect(() => {
        if (isScopedUser && user?.orgId && !selectedOrgId) {
            setSelectedOrgId(user.orgId);
        }
    }, [isScopedUser, user?.orgId, selectedOrgId]);

    // Auto-select organization if only one available (for admins)
    const { shouldDisable: disableOrgSelectAuto } = useAutoSelect(
        orgList,
        selectedOrgId,
        setSelectedOrgId
    );

    // Disable org dropdown for scoped users
    const disableOrgSelect = isScopedUser || disableOrgSelectAuto;

    useEffect(() => {
        if (user && selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
            // Don't reset branch for scoped users
            if (!isScopedUser) {
                setSelectedBranchId("");
            }
        }
    }, [selectedOrgId, dispatch, isScopedUser, user]);

    // Auto-select branch for scoped users (INVENTORY_OPERATOR, BRANCH_MANAGER)
    useEffect(() => {
        if (isScopedUser && user?.branchId && !selectedBranchId) {
            setSelectedBranchId(user.branchId);
        }
    }, [isScopedUser, user?.branchId, selectedBranchId]);

    // Auto-select branch if only one available (for admins)
    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");
    const { shouldDisable: disableBranchSelectAuto } = useAutoSelect(
        activeBranches,
        selectedBranchId,
        setSelectedBranchId
    );

    // Disable branch dropdown for scoped users
    const disableBranchSelect = isScopedUser || disableBranchSelectAuto;

    useEffect(() => {
        if (selectedBranchId) {
            dispatch(
                fetchBranchAssignments({
                    branchId: selectedBranchId,
                    organizationId: selectedOrgId,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    page: currentPage,
                    limit: 10,
                })
            );
        } else {
            dispatch(clearAssignments());
        }
    }, [selectedBranchId, selectedOrgId, statusFilter, currentPage, dispatch]);

    const handleRefresh = () => {
        if (selectedBranchId) {
            dispatch(
                fetchBranchAssignments({
                    branchId: selectedBranchId,
                    organizationId: selectedOrgId,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    page: currentPage,
                    limit: 10,
                })
            );
        }
    };

    return (
        <ProtectedPage module="ASSIGNMENTS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Assignments</h1>
                        <p className="text-muted-foreground">Manage asset assignments to users</p>
                    </div>
                    <PermissionGate module="ASSIGNMENTS" action="CREATE">
                        <AssignAssetDialog
                            trigger={
                                <Button disabled={!selectedBranchId}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Assign Asset
                                </Button>
                            }
                            onSuccess={handleRefresh}
                            defaultOrgId={selectedOrgId}
                            defaultBranchId={selectedBranchId}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>All Assignments</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${assignmentList.length} of ${meta.total} assignments`
                                        : "Select a branch to view its asset assignments"}
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
                                    value={selectedBranchId}
                                    onValueChange={setSelectedBranchId}
                                    disabled={!selectedOrgId || disableBranchSelect}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="PENDING_RETURN">Pending Return</SelectItem>
                                        <SelectItem value="IN_REPAIR">In Repair</SelectItem>
                                        <SelectItem value="RETURNED">Returned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedBranchId ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">Select a branch to view assignments</p>
                            </div>
                        ) : isLoading ? (
                            <TableSkeleton rows={5} columns={6} />
                        ) : assignmentList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No assignments found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Asset</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead className="hidden md:table-cell">Serial</TableHead>
                                                <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {assignmentList.map((assignment) => (
                                                <TableRow key={assignment.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{assignment.product?.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {assignment.product?.sku}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            {assignment.user?.firstName} {assignment.user?.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {assignment.user?.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell font-mono text-sm">
                                                        {assignment.serialNumber || "-"}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                        {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                assignment.status
                                                            )}`}
                                                        >
                                                            {assignment.status.replace("_", " ")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setViewAssignment(assignment)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {meta.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Page {meta.page} of {meta.totalPages}
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

                {/* Simple View Dialog */}
                {viewAssignment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-lg m-4">
                            <CardHeader>
                                <CardTitle>Assignment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Asset</p>
                                        <p className="font-medium">{viewAssignment.product?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">SKU</p>
                                        <p className="font-medium">{viewAssignment.product?.sku}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Serial Number</p>
                                        <p className="font-medium">{viewAssignment.serialNumber || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <p className="font-medium">{viewAssignment.status}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Assigned To</p>
                                        <p className="font-medium">
                                            {viewAssignment.user?.firstName} {viewAssignment.user?.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Condition</p>
                                        <p className="font-medium">{viewAssignment.conditionOnIssue || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Purpose</p>
                                        <p className="font-medium">{viewAssignment.purpose || "N/A"}</p>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => setViewAssignment(null)}>
                                    Close
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </ProtectedPage>
    );
}
