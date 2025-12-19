"use client";

import { Package, Calendar, Shield, Wrench, Building2, MapPin, Tag, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem, InventoryStatus } from "@/lib/types";

interface ViewInventoryDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: () => void;
}

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

const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
};

export function ViewInventoryDialog({
    item,
    open,
    onOpenChange,
    onEdit,
}: ViewInventoryDialogProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Inventory Item Details
                    </DialogTitle>
                    <DialogDescription>
                        View complete details for this inventory item.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Product Info */}
                    <div className="p-4 rounded-lg bg-muted space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">{item.product?.name || "Unknown Product"}</h3>
                                <p className="text-sm text-muted-foreground">SKU: {item.product?.sku || "-"}</p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(item.status)}>
                                {item.status === "WRITTEN_OFF" ? "Written Off" : item.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Basic Details Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Branch</p>
                                <p className="font-medium">{item.branch?.name || "Unknown"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Serial Number</p>
                                <p className="font-medium">{item.serialNumber || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Barcode</p>
                                <p className="font-medium">{item.barcode || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Quantity</p>
                                <p className="font-medium">{item.quantity}</p>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Date & Vendor */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {item.purchaseDate && (
                            <div className="flex items-start gap-3 p-3 border rounded-lg">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Purchase Date</p>
                                    <p className="font-medium">{formatDate(item.purchaseDate)}</p>
                                </div>
                            </div>
                        )}
                        {(item.vendor || item.vendorId) && (
                            <div className="flex items-start gap-3 p-3 border rounded-lg">
                                <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Vendor</p>
                                    <p className="font-medium">{item.vendor?.name || item.vendorId || "-"}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Service Details */}
                    {item.requiresService && (
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Service Required</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Frequency: </span>
                                    <span>{item.serviceFrequency || "Not set"}</span>
                                </div>
                                {item.serviceInstructions && (
                                    <div className="sm:col-span-2">
                                        <span className="text-muted-foreground">Instructions: </span>
                                        <span>{item.serviceInstructions}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warranty Details */}
                    {item.hasWarranty && (
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Warranty</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                {item.warrantyProvider && (
                                    <div>
                                        <span className="text-muted-foreground">Provider: </span>
                                        <span>{item.warrantyProvider}</span>
                                    </div>
                                )}
                                {item.warrantyExpiryDate && (
                                    <div>
                                        <span className="text-muted-foreground">Expires: </span>
                                        <span className={
                                            new Date(item.warrantyExpiryDate) < new Date()
                                                ? "text-red-600 font-medium"
                                                : ""
                                        }>
                                            {formatDate(item.warrantyExpiryDate)}
                                        </span>
                                    </div>
                                )}
                                {item.warrantyDurationMonths && (
                                    <div>
                                        <span className="text-muted-foreground">Duration: </span>
                                        <span>{item.warrantyDurationMonths} months</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Guarantee Details */}
                    {item.hasGuarantee && (
                        <div className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">Guarantee</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                {item.guaranteeExpiryDate && (
                                    <div>
                                        <span className="text-muted-foreground">Expires: </span>
                                        <span className={
                                            new Date(item.guaranteeExpiryDate) < new Date()
                                                ? "text-red-600 font-medium"
                                                : ""
                                        }>
                                            {formatDate(item.guaranteeExpiryDate)}
                                        </span>
                                    </div>
                                )}
                                {item.guaranteeDurationMonths && (
                                    <div>
                                        <span className="text-muted-foreground">Duration: </span>
                                        <span>{item.guaranteeDurationMonths} months</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground border-t pt-3 flex gap-4">
                        <span>Created: {formatDate(item.createdAt)}</span>
                        <span>Updated: {formatDate(item.updatedAt)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {onEdit && (
                        <Button onClick={onEdit}>
                            Edit Item
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
