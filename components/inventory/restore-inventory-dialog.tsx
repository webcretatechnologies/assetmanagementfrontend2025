"use client";

import { useState, useEffect } from "react";
import { Loader2, RotateCcw, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addInventory } from "@/store/slices/inventorySlice";
import { lookupProduct } from "@/lib/api/products";
import type { InventoryItem, ServiceFrequency } from "@/lib/types";
import { toast } from "sonner";

interface RestoreInventoryDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const serviceFrequencies: { value: ServiceFrequency; label: string }[] = [
    { value: "NONE", label: "None" },
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
];

export function RestoreInventoryDialog({
    item,
    open,
    onOpenChange,
    onSuccess,
}: RestoreInventoryDialogProps) {
    const [productType, setProductType] = useState<"ASSET" | "CONSUMABLE" | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    // Basic fields
    const [quantity, setQuantity] = useState(1);
    const [serialNumbers, setSerialNumbers] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");

    // Service fields
    const [requiresService, setRequiresService] = useState(false);
    const [serviceFrequency, setServiceFrequency] = useState<ServiceFrequency>("NONE");
    const [serviceInstructions, setServiceInstructions] = useState("");

    // Warranty fields
    const [hasWarranty, setHasWarranty] = useState(false);
    const [warrantyProvider, setWarrantyProvider] = useState("");
    const [warrantyDurationMonths, setWarrantyDurationMonths] = useState(12);

    // Guarantee fields
    const [hasGuarantee, setHasGuarantee] = useState(false);
    const [guaranteeDurationMonths, setGuaranteeDurationMonths] = useState(12);

    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.inventory);

    // Compute form validity for button disable state
    const isFormValid = (() => {
        if (!productType) return false;
        if (productType === "ASSET") {
            const serials = serialNumbers.split(",").map((s) => s.trim()).filter(Boolean);
            return serials.length === quantity && quantity > 0;
        }
        return quantity > 0;
    })();

    // Reset and pre-populate state when dialog opens with new item
    useEffect(() => {
        if (open && item) {
            // Reset lookup state
            setProductType(null);
            setLookupError(null);

            // Pre-populate from existing item
            setQuantity(item.quantity || 1);
            setSerialNumbers(item.serialNumber || "");

            // Service fields
            setRequiresService(item.requiresService || false);
            setServiceFrequency(item.serviceFrequency || "NONE");
            setServiceInstructions(item.serviceInstructions || "");

            // Warranty fields
            setHasWarranty(item.hasWarranty || false);
            setWarrantyProvider(item.warrantyProvider || "");
            setWarrantyDurationMonths(item.warrantyDurationMonths || 12);

            // Guarantee fields
            setHasGuarantee(item.hasGuarantee || false);
            setGuaranteeDurationMonths(item.guaranteeDurationMonths || 12);

            // Lookup product type
            lookupProductType();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item?.id]);

    const lookupProductType = async () => {
        if (!item?.product?.sku || !item.organizationId || !item.branchId) {
            setLookupError("Missing product information");
            return;
        }

        setIsLookingUp(true);
        setLookupError(null);

        try {
            const result = await lookupProduct(
                item.product.sku,
                item.organizationId,
                item.branchId
            );
            setProductType(result.productType);
        } catch (error) {
            setLookupError(
                error instanceof Error ? error.message : "Failed to lookup product type"
            );
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleRestore = async () => {
        if (!item) return;

        // Validate based on product type
        if (productType === "ASSET") {
            const serials = serialNumbers.split(",").map((s) => s.trim()).filter(Boolean);
            if (serials.length === 0) {
                toast.error("Serial numbers are required for assets");
                return;
            }
            if (serials.length !== quantity) {
                toast.error(`Please provide ${quantity} serial number(s)`);
                return;
            }
        }

        const serialNumbersArray = productType === "ASSET"
            ? serialNumbers.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined;

        const result = await dispatch(
            addInventory({
                organizationId: item.organizationId,
                branchId: item.branchId,
                productId: item.productId,
                quantity: quantity,
                serialNumbers: serialNumbersArray,
                purchaseDate: purchaseDate || undefined,
                // Service fields
                requiresService: requiresService,
                serviceFrequency: requiresService ? serviceFrequency : undefined,
                serviceInstructions: requiresService ? serviceInstructions : undefined,
                // Warranty fields
                hasWarranty: hasWarranty,
                warrantyProvider: hasWarranty ? warrantyProvider : undefined,
                warrantyDurationMonths: hasWarranty ? warrantyDurationMonths : undefined,
                // Guarantee fields
                hasGuarantee: hasGuarantee,
                guaranteeDurationMonths: hasGuarantee ? guaranteeDurationMonths : undefined,
            })
        );

        if (addInventory.fulfilled.match(result)) {
            toast.success("Item restored successfully");
            onOpenChange(false);
            // Let parent component handle refresh with current filters
            onSuccess?.();
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        Restore Inventory Item
                    </DialogTitle>
                    <DialogDescription>
                        Restore this written-off item back to inventory with all its details.
                    </DialogDescription>
                </DialogHeader>

                {item && (
                    <div className="py-4 space-y-4">
                        {/* Product Info */}
                        <div className="p-3 rounded-lg bg-muted space-y-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{item.product?.name || "Unknown Product"}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                SKU: {item.product?.sku}
                            </div>
                            {productType && (
                                <Badge variant="outline" className={
                                    productType === "ASSET"
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : "bg-green-500/10 text-green-600 border-green-500/20"
                                }>
                                    {productType}
                                </Badge>
                            )}
                        </div>

                        {/* Loading state */}
                        {isLookingUp && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Looking up product type...</span>
                            </div>
                        )}

                        {/* Error state */}
                        {lookupError && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                {lookupError}
                            </div>
                        )}

                        {/* Form fields based on product type */}
                        {productType && !isLookingUp && (
                            <div className="space-y-4">
                                {/* Basic Fields */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="restore-quantity">Quantity *</Label>
                                        <Input
                                            id="restore-quantity"
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="restore-purchase-date">Purchase Date</Label>
                                        <Input
                                            id="restore-purchase-date"
                                            type="date"
                                            value={purchaseDate}
                                            onChange={(e) => setPurchaseDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Serial Numbers - only for ASSET type */}
                                {productType === "ASSET" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="restore-serials">
                                            Serial Numbers * <span className="text-muted-foreground font-normal">(comma-separated)</span>
                                        </Label>
                                        <Textarea
                                            id="restore-serials"
                                            placeholder="SN001, SN002, SN003"
                                            value={serialNumbers}
                                            onChange={(e) => setSerialNumbers(e.target.value)}
                                            rows={2}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter {quantity} serial number{quantity > 1 ? "s" : ""}, separated by commas.
                                        </p>
                                    </div>
                                )}

                                {/* Service Options */}
                                <div className="space-y-3 p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="restore-requires-service"
                                            checked={requiresService}
                                            onChange={(e) => setRequiresService(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="restore-requires-service" className="font-normal">
                                            Requires Service
                                        </Label>
                                    </div>
                                    {requiresService && (
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label>Service Frequency</Label>
                                                <Select
                                                    value={serviceFrequency}
                                                    onValueChange={(val) => setServiceFrequency(val as ServiceFrequency)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {serviceFrequencies.map((freq) => (
                                                            <SelectItem key={freq.value} value={freq.value}>
                                                                {freq.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="restore-service-instructions">Service Instructions</Label>
                                                <Textarea
                                                    id="restore-service-instructions"
                                                    placeholder="Enter service instructions..."
                                                    value={serviceInstructions}
                                                    onChange={(e) => setServiceInstructions(e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Warranty Options */}
                                <div className="space-y-3 p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="restore-has-warranty"
                                            checked={hasWarranty}
                                            onChange={(e) => setHasWarranty(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="restore-has-warranty" className="font-normal">
                                            Has Warranty
                                        </Label>
                                    </div>
                                    {hasWarranty && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="restore-warranty-duration">Duration (months)</Label>
                                                <Input
                                                    id="restore-warranty-duration"
                                                    type="number"
                                                    min={1}
                                                    value={warrantyDurationMonths}
                                                    onChange={(e) => setWarrantyDurationMonths(parseInt(e.target.value) || 12)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="restore-warranty-provider">Provider</Label>
                                                <Input
                                                    id="restore-warranty-provider"
                                                    placeholder="Warranty provider"
                                                    value={warrantyProvider}
                                                    onChange={(e) => setWarrantyProvider(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Guarantee Options */}
                                <div className="space-y-3 p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="restore-has-guarantee"
                                            checked={hasGuarantee}
                                            onChange={(e) => setHasGuarantee(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="restore-has-guarantee" className="font-normal">
                                            Has Guarantee
                                        </Label>
                                    </div>
                                    {hasGuarantee && (
                                        <div className="space-y-2">
                                            <Label htmlFor="restore-guarantee-duration">Duration (months)</Label>
                                            <Input
                                                id="restore-guarantee-duration"
                                                type="number"
                                                min={1}
                                                value={guaranteeDurationMonths}
                                                onChange={(e) => setGuaranteeDurationMonths(parseInt(e.target.value) || 12)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRestore}
                        disabled={isLoading || isLookingUp || !productType || !!lookupError || !isFormValid}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Restoring...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
