"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Pencil } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateInventoryItem } from "@/store/slices/inventorySlice";
import { getSuppliers } from "@/lib/api/vendors";
import type { InventoryItem, ServiceFrequency, Vendor, UpdateInventoryInput } from "@/lib/types";
import { toast } from "sonner";

interface EditInventoryDialogProps {
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

export function EditInventoryDialog({
    item,
    open,
    onOpenChange,
    onSuccess,
}: EditInventoryDialogProps) {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");
    const [requiresService, setRequiresService] = useState(false);
    const [serviceFrequency, setServiceFrequency] = useState<ServiceFrequency>("NONE");
    const [hasWarranty, setHasWarranty] = useState(false);
    const [hasGuarantee, setHasGuarantee] = useState(false);

    const dispatch = useAppDispatch();
    const { isUpdating } = useAppSelector((state) => state.inventory);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
    } = useForm<{
        serialNumber: string;
        barcode: string;
        purchaseDate: string;
        serviceInstructions: string;
        warrantyProvider: string;
        warrantyExpiryDate: string;
        guaranteeExpiryDate: string;
    }>();

    // Populate form when dialog opens with item
    useEffect(() => {
        if (open && item) {
            reset({
                serialNumber: item.serialNumber || "",
                barcode: item.barcode || "",
                purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
                serviceInstructions: item.serviceInstructions || "",
                warrantyProvider: item.warrantyProvider || "",
                warrantyExpiryDate: item.warrantyExpiryDate ? item.warrantyExpiryDate.split("T")[0] : "",
                guaranteeExpiryDate: item.guaranteeExpiryDate ? item.guaranteeExpiryDate.split("T")[0] : "",
            });

            setRequiresService(item.requiresService || false);
            setServiceFrequency(item.serviceFrequency || "NONE");
            setHasWarranty(item.hasWarranty || false);
            setHasGuarantee(item.hasGuarantee || false);
            setSelectedVendorId(item.vendorId || "");

            // Fetch vendors
            if (item.organizationId) {
                setIsLoadingVendors(true);
                getSuppliers(item.organizationId)
                    .then(setVendors)
                    .catch(() => console.error("Failed to load vendors"))
                    .finally(() => setIsLoadingVendors(false));
            }
        }
    }, [open, item, reset]);

    const onSubmit = async (data: {
        serialNumber: string;
        barcode: string;
        purchaseDate: string;
        serviceInstructions: string;
        warrantyProvider: string;
        warrantyExpiryDate: string;
        guaranteeExpiryDate: string;
    }) => {
        if (!item) return;

        const payload: UpdateInventoryInput = {
            serialNumber: data.serialNumber || undefined,
            barcode: data.barcode || undefined,
            purchaseDate: data.purchaseDate || undefined,
            vendorId: selectedVendorId && selectedVendorId !== "none" ? selectedVendorId : undefined,
            requiresService,
            serviceFrequency: requiresService ? serviceFrequency : undefined,
            serviceInstructions: requiresService ? data.serviceInstructions : undefined,
            hasWarranty,
            warrantyProvider: hasWarranty ? data.warrantyProvider : undefined,
            warrantyExpiryDate: hasWarranty ? data.warrantyExpiryDate : undefined,
            hasGuarantee,
            guaranteeExpiryDate: hasGuarantee ? data.guaranteeExpiryDate : undefined,
        };

        const result = await dispatch(updateInventoryItem({ id: item.id, data: payload }));

        if (updateInventoryItem.fulfilled.match(result)) {
            toast.success("Inventory item updated successfully");
            onOpenChange(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Inventory Item
                    </DialogTitle>
                    <DialogDescription>
                        Update details for this inventory item.
                    </DialogDescription>
                </DialogHeader>

                {item && (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4 py-4">
                            {/* Product Info (Read-only) */}
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                                <p className="text-sm text-muted-foreground">SKU: {item.product?.sku}</p>
                            </div>

                            {/* Basic Fields */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="serialNumber">Serial Number</Label>
                                    <Input
                                        id="serialNumber"
                                        placeholder="Enter serial number"
                                        {...register("serialNumber")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        placeholder="Enter barcode"
                                        {...register("barcode")}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                                    <Input
                                        id="purchaseDate"
                                        type="date"
                                        {...register("purchaseDate")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vendor</Label>
                                    <Select
                                        value={selectedVendorId}
                                        onValueChange={setSelectedVendorId}
                                        disabled={isLoadingVendors}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingVendors ? "Loading..." : "Select vendor"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No vendor</SelectItem>
                                            {vendors.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id}>
                                                    {vendor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Service Options */}
                            <div className="space-y-3 p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit-requires-service"
                                        checked={requiresService}
                                        onChange={(e) => setRequiresService(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="edit-requires-service" className="font-normal">
                                        Requires Service
                                    </Label>
                                </div>
                                {requiresService && (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Service Frequency</Label>
                                            <Select
                                                value={serviceFrequency}
                                                onValueChange={(v) => setServiceFrequency(v as ServiceFrequency)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {serviceFrequencies.map((sf) => (
                                                        <SelectItem key={sf.value} value={sf.value}>
                                                            {sf.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="serviceInstructions">Instructions</Label>
                                            <Input
                                                id="serviceInstructions"
                                                placeholder="Service instructions"
                                                {...register("serviceInstructions")}
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
                                        id="edit-has-warranty"
                                        checked={hasWarranty}
                                        onChange={(e) => setHasWarranty(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="edit-has-warranty" className="font-normal">
                                        Has Warranty
                                    </Label>
                                </div>
                                {hasWarranty && (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="warrantyProvider">Provider</Label>
                                            <Input
                                                id="warrantyProvider"
                                                placeholder="Warranty provider"
                                                {...register("warrantyProvider")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="warrantyExpiryDate">Expiry Date</Label>
                                            <Input
                                                id="warrantyExpiryDate"
                                                type="date"
                                                {...register("warrantyExpiryDate")}
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
                                        id="edit-has-guarantee"
                                        checked={hasGuarantee}
                                        onChange={(e) => setHasGuarantee(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="edit-has-guarantee" className="font-normal">
                                        Has Guarantee
                                    </Label>
                                </div>
                                {hasGuarantee && (
                                    <div className="space-y-2">
                                        <Label htmlFor="guaranteeExpiryDate">Expiry Date</Label>
                                        <Input
                                            id="guaranteeExpiryDate"
                                            type="date"
                                            {...register("guaranteeExpiryDate")}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
