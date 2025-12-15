"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { AssetRequest } from "@/lib/types";

interface ViewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: AssetRequest | null;
}

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

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export function ViewRequestDialog({
    open,
    onOpenChange,
    request,
}: ViewRequestDialogProps) {
    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Request Details</DialogTitle>
                    <DialogDescription>
                        {request.requestType} request for {request.assignment?.product?.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                request.status
                            )}`}
                        >
                            {request.status.replace("_", " ")}
                        </span>
                    </div>

                    {/* Asset Info */}
                    <div className="rounded-lg border p-4 space-y-3">
                        <h4 className="font-medium text-sm">Asset Information</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Product</span>
                                <p className="font-medium">{request.assignment?.product?.name || "-"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">SKU</span>
                                <p className="font-medium">{request.assignment?.product?.sku || "-"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Serial Number</span>
                                <p className="font-medium">{request.assignment?.serialNumber || "-"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Category</span>
                                <p className="font-medium">{request.assignment?.product?.category?.name || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Request Details */}
                    <div className="rounded-lg border p-4 space-y-3">
                        <h4 className="font-medium text-sm">Request Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Type</span>
                                <p className="font-medium">{request.requestType}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Urgency</span>
                                <p className={`font-medium ${getUrgencyColor(request.urgency)}`}>
                                    {request.urgency}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Reason</span>
                                <p className="font-medium">{request.reason}</p>
                            </div>
                            {request.description && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Description</span>
                                    <p className="font-medium">{request.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-lg border p-4 space-y-3">
                        <h4 className="font-medium text-sm">Timeline</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Requested</span>
                                <span>{formatDate(request.requestedAt)}</span>
                            </div>
                            {request.claimedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Claimed</span>
                                    <span>{formatDate(request.claimedAt)}</span>
                                </div>
                            )}
                            {request.reviewedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reviewed</span>
                                    <span>{formatDate(request.reviewedAt)}</span>
                                </div>
                            )}
                            {request.completedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Completed</span>
                                    <span>{formatDate(request.completedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolution Notes */}
                    {(request.resolutionNotes || request.rejectionReason) && (
                        <div className="rounded-lg border p-4 space-y-2">
                            <h4 className="font-medium text-sm">
                                {request.rejectionReason ? "Rejection Reason" : "Resolution Notes"}
                            </h4>
                            <p className="text-sm">
                                {request.rejectionReason || request.resolutionNotes}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
