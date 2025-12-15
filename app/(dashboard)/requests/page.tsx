"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Eye, Check, X, CheckCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import {
    fetchRequestQueue,
    fetchMyRequests,
    claimRequest,
    approveRequest,
    rejectRequest,
    completeRequest,
    clearRequests,
} from "@/store/slices/requestSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { ProtectedPage } from "@/components/rbac";
import { isInventoryOperator, isBranchManager, canViewAllRequests, isEmployee } from "@/lib/rbac";
import { useAutoSelect } from "@/components/ui/auto-select";
import { CreateRequestDialog } from "@/components/requests/create-request-dialog";
import { ViewRequestDialog } from "@/components/requests/view-request-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { AssetRequest } from "@/lib/types";

const getStatusColor = (status: string) => {
    switch (status) {
        case "PENDING":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "IN_REVIEW":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "APPROVED":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "REJECTED":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        case "COMPLETED":
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
        case "URGENT":
            return "text-red-500 font-semibold";
        case "HIGH":
            return "text-orange-500";
        case "MEDIUM":
            return "text-amber-500";
        default:
            return "text-gray-500";
    }
};

export default function RequestQueuePage() {
    const dispatch = useAppDispatch();
    const { requests, isLoading, meta } = useAppSelector((state) => state.requests);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { user } = useAppSelector((state) => state.auth);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [actionRequest, setActionRequest] = useState<AssetRequest | null>(null);
    const [viewRequest, setViewRequest] = useState<AssetRequest | null>(null);

    const userRole = user?.role;
    // Include EMPLOYEE in scoped users - they have their org auto-selected
    const isScopedUser = isInventoryOperator(userRole) || isBranchManager(userRole) || isEmployee(userRole);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];
    const requestList = Array.isArray(requests) ? requests : [];

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
                setSelectedBranchId("all");
            }
        }
    }, [selectedOrgId, dispatch, isScopedUser, user]);

    // Auto-select branch for scoped users (INVENTORY_OPERATOR, BRANCH_MANAGER)
    useEffect(() => {
        if (isScopedUser && user?.branchId && selectedBranchId === "all") {
            setSelectedBranchId(user.branchId);
        }
    }, [isScopedUser, user?.branchId, selectedBranchId]);

    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");

    // Determine if user can view all requests or only their own
    const canViewAll = canViewAllRequests(userRole);

    useEffect(() => {
        if (!user) return; // Guard against logout

        if (canViewAll) {
            // INVENTORY_OPERATOR and SERVICE_TECHNICIAN see all requests
            if (selectedOrgId) {
                dispatch(
                    fetchRequestQueue({
                        organizationId: selectedOrgId,
                        branchId: selectedBranchId !== "all" ? selectedBranchId : undefined,
                        requestType: typeFilter !== "all" ? typeFilter : undefined,
                        status: statusFilter !== "all" ? statusFilter : undefined,
                        page: currentPage,
                        limit: 10,
                    })
                );
            } else {
                dispatch(clearRequests());
            }
        } else {
            // Other roles see only their own requests
            if (selectedOrgId) {
                dispatch(fetchMyRequests(selectedOrgId));
            } else {
                dispatch(clearRequests());
            }
        }
    }, [user, canViewAll, selectedOrgId, selectedBranchId, typeFilter, statusFilter, currentPage, dispatch]);

    // Use appropriate request list based on user role
    const { myRequests } = useAppSelector((state) => state.requests);

    // Ensure myRequests is always an array
    const myRequestList = Array.isArray(myRequests) ? myRequests : [];

    const displayRequests = canViewAll ? requestList : myRequestList;

    const handleClaim = async (id: string) => {
        await dispatch(claimRequest(id));
    };

    const handleApprove = async (id: string) => {
        await dispatch(approveRequest({ id, data: {} }));
        setActionRequest(null);
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (reason) {
            await dispatch(rejectRequest({ id, rejectionReason: reason }));
        }
    };

    const handleComplete = async (id: string) => {
        await dispatch(completeRequest({ id, data: {} }));
        setActionRequest(null);
    };

    return (
        <ProtectedPage module="REQUESTS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            {canViewAll ? "Request Queue" : "My Requests"}
                        </h1>
                        <p className="text-muted-foreground">
                            {canViewAll
                                ? "Process return and repair requests"
                                : "View and manage your asset requests"
                            }
                        </p>
                    </div>
                    {selectedOrgId && user?.id && (
                        <CreateRequestDialog
                            organizationId={selectedOrgId}
                            userId={user.id}
                            onSuccess={() => {
                                if (canViewAll) {
                                    dispatch(fetchRequestQueue({
                                        organizationId: selectedOrgId,
                                        branchId: selectedBranchId !== "all" ? selectedBranchId : undefined,
                                        page: currentPage,
                                        limit: 10,
                                    }));
                                } else {
                                    dispatch(fetchMyRequests(selectedOrgId));
                                }
                            }}
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Request
                                </Button>
                            }
                        />
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>Pending Requests</CardTitle>
                                <CardDescription>
                                    {meta.total > 0
                                        ? `Showing ${requestList.length} of ${meta.total} requests`
                                        : "View and process asset requests"}
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
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="RETURN">Return</SelectItem>
                                        <SelectItem value="REPAIR">Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedOrgId ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">Select an organization to view requests</p>
                            </div>
                        ) : isLoading ? (
                            <TableSkeleton rows={5} columns={7} />
                        ) : displayRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No requests found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Asset</TableHead>
                                                <TableHead>Serial Number</TableHead>
                                                {canViewAll && <TableHead>User</TableHead>}
                                                <TableHead>Type</TableHead>
                                                <TableHead className="hidden md:table-cell">Urgency</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayRequests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{request.assignment?.product?.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.assignment?.product?.sku}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {request.assignment?.serialNumber || "-"}
                                                        </div>
                                                    </TableCell>
                                                    {canViewAll && (
                                                        <TableCell>
                                                            <div>
                                                                {request.requester?.firstName || request.assignment?.user?.firstName}{" "}
                                                                {request.requester?.lastName || request.assignment?.user?.lastName}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {request.requester?.email || request.assignment?.user?.email}
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    <TableCell>{request.requestType}</TableCell>
                                                    <TableCell className={`hidden md:table-cell ${getUrgencyColor(request.urgency)}`}>
                                                        {request.urgency}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                request.status
                                                            )}`}
                                                        >
                                                            {request.status.replace("_", " ")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {canViewAll ? (
                                                            <div className="flex justify-end gap-1">
                                                                {request.status === "PENDING" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleClaim(request.id)}
                                                                    >
                                                                        Claim
                                                                    </Button>
                                                                )}
                                                                {request.status === "IN_REVIEW" && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleApprove(request.id)}
                                                                        >
                                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleReject(request.id)}
                                                                        >
                                                                            <X className="h-4 w-4 text-red-500" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {request.status === "APPROVED" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleComplete(request.id)}
                                                                    >
                                                                        <CheckCircle className="mr-1 h-4 w-4" />
                                                                        Complete
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => setViewRequest(request)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
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
            </div>

            {/* View Request Dialog for employees */}
            <ViewRequestDialog
                open={!!viewRequest}
                onOpenChange={(open) => !open && setViewRequest(null)}
                request={viewRequest}
            />
        </ProtectedPage>
    );
}
