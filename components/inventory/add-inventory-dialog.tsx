"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addInventory } from "@/store/slices/inventorySlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { fetchProducts } from "@/store/slices/productSlice";
import { isSuperAdmin } from "@/lib/rbac";
import type { AddInventoryInput, ServiceFrequency } from "@/lib/types";

const serviceFrequencies: { value: ServiceFrequency; label: string }[] = [
    { value: "NONE", label: "None" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
];

interface AddInventoryDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
    defaultBranchId?: string;
}

export function AddInventoryDialog({
    trigger,
    onSuccess,
    defaultOrgId,
    defaultBranchId,
}: AddInventoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || "");
    const [selectedProductId, setSelectedProductId] = useState("");
    // Service/Warranty state
    const [requiresService, setRequiresService] = useState(false);
    const [selectedServiceFreq, setSelectedServiceFreq] = useState<ServiceFrequency>("NONE");
    const [hasWarranty, setHasWarranty] = useState(false);
    const [hasGuarantee, setHasGuarantee] = useState(false);
    const [purchaseDate, setPurchaseDate] = useState("");

    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.inventory);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { products } = useAppSelector((state) => state.products);
    const { user } = useAppSelector((state) => state.auth);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];
    const productList = Array.isArray(products) ? products : [];

    const userRole = user?.role;
    const canSelectOrg = isSuperAdmin(userRole);

    useEffect(() => {
        if (open) {
            if (orgList.length === 0) {
                dispatch(fetchOrganizations());
            }
            if (defaultOrgId) {
                setSelectedOrgId(defaultOrgId);
            }
            if (defaultBranchId) {
                setSelectedBranchId(defaultBranchId);
            }
        }
    }, [open, orgList.length, dispatch, defaultOrgId, defaultBranchId]);

    useEffect(() => {
        if (selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
            dispatch(fetchProducts({ organizationId: selectedOrgId, page: 1, limit: 100 }));
        }
    }, [selectedOrgId, dispatch]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<{
        quantity: number;
        serialNumbers: string;
        serviceInstructions: string;
        warrantyProvider: string;
        warrantyDurationMonths: number;
        guaranteeDurationMonths: number;
    }>({
        defaultValues: {
            quantity: 1,
            serialNumbers: "",
            serviceInstructions: "",
            warrantyProvider: "",
            warrantyDurationMonths: 12,
            guaranteeDurationMonths: 12,
        },
    });

    const selectedProduct = productList.find((p) => p.id === selectedProductId);
    const isSerialized = selectedProduct?.isSerialized;
    const quantity = watch("quantity");

    const onSubmit = async (data: {
        quantity: number;
        serialNumbers: string;
        serviceInstructions: string;
        warrantyProvider: string;
        warrantyDurationMonths: number;
        guaranteeDurationMonths: number;
    }) => {
        if (!selectedOrgId || !selectedBranchId || !selectedProductId) return;

        const serialNumbers = isSerialized && data.serialNumbers
            ? data.serialNumbers.split("\n").map((s) => s.trim()).filter(Boolean)
            : undefined;

        const payload: AddInventoryInput = {
            organizationId: selectedOrgId,
            branchId: selectedBranchId,
            productId: selectedProductId,
            quantity: data.quantity,
            serialNumbers,
            purchaseDate: purchaseDate || undefined,
            // Service fields
            requiresService: requiresService,
            serviceFrequency: requiresService ? selectedServiceFreq : "NONE",
            serviceInstructions: requiresService ? data.serviceInstructions : undefined,
            // Warranty fields
            hasWarranty: hasWarranty,
            warrantyProvider: hasWarranty ? data.warrantyProvider : undefined,
            warrantyDurationMonths: hasWarranty ? data.warrantyDurationMonths : undefined,
            // Guarantee fields
            hasGuarantee: hasGuarantee,
            guaranteeDurationMonths: hasGuarantee ? data.guaranteeDurationMonths : undefined,
        };

        const result = await dispatch(addInventory(payload));
        if (addInventory.fulfilled.match(result)) {
            reset();
            setSelectedProductId("");
            setRequiresService(false);
            setSelectedServiceFreq("NONE");
            setHasWarranty(false);
            setHasGuarantee(false);
            setPurchaseDate("");
            setOpen(false);
            onSuccess?.();
        }
    };

    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");
    const activeProducts = productList.filter((p) => p.status === "ACTIVE");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Stock</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Inventory Stock</DialogTitle>
                    <DialogDescription>
                        Add new stock to a branch location.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Organization */}
                        {canSelectOrg && (
                            <div className="space-y-2">
                                <Label>Organization *</Label>
                                <Select
                                    value={selectedOrgId}
                                    onValueChange={setSelectedOrgId}
                                    disabled={!!defaultOrgId}
                                >
                                    <SelectTrigger>
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
                            </div>
                        )}

                        {/* Branch */}
                        <div className="space-y-2">
                            <Label>Branch *</Label>
                            <Select
                                value={selectedBranchId}
                                onValueChange={setSelectedBranchId}
                                disabled={!selectedOrgId || !!defaultBranchId}
                            >
                                <SelectTrigger>
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
                        </div>

                        {/* Product */}
                        <div className="space-y-2">
                            <Label>Product *</Label>
                            <Select
                                value={selectedProductId}
                                onValueChange={setSelectedProductId}
                                disabled={!selectedOrgId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} ({product.sku})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                {...register("quantity", {
                                    required: "Quantity is required",
                                    min: { value: 1, message: "Minimum quantity is 1" },
                                    valueAsNumber: true,
                                })}
                            />
                            {errors.quantity && (
                                <p className="text-xs text-destructive">{errors.quantity.message}</p>
                            )}
                        </div>

                        {/* Purchase Date */}
                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate">Purchase Date</Label>
                            <Input
                                id="purchaseDate"
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Warranty/Guarantee expiry will be calculated from this date
                            </p>
                        </div>

                        {/* Serial Numbers (for serialized products) */}
                        {isSerialized && (
                            <div className="space-y-2">
                                <Label htmlFor="serialNumbers">
                                    Serial Numbers * (one per line, {quantity} required)
                                </Label>
                                <Textarea
                                    id="serialNumbers"
                                    placeholder="Enter serial numbers, one per line..."
                                    rows={4}
                                    {...register("serialNumbers", {
                                        validate: (value) => {
                                            if (!isSerialized) return true;
                                            const serials = value.split("\n").filter((s) => s.trim());
                                            if (serials.length !== quantity) {
                                                return `Please enter exactly ${quantity} serial number(s)`;
                                            }
                                            return true;
                                        },
                                    })}
                                />
                                {errors.serialNumbers && (
                                    <p className="text-xs text-destructive">
                                        {errors.serialNumbers.message}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Service Options */}
                        <div className="space-y-3 p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="requiresService"
                                    checked={requiresService}
                                    onChange={(e) => setRequiresService(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="requiresService" className="font-normal">
                                    Requires Service
                                </Label>
                            </div>
                            {requiresService && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Service Frequency</Label>
                                        <Select
                                            value={selectedServiceFreq}
                                            onValueChange={(v) => setSelectedServiceFreq(v as ServiceFrequency)}
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
                                    id="hasWarranty"
                                    checked={hasWarranty}
                                    onChange={(e) => setHasWarranty(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="hasWarranty" className="font-normal">
                                    Has Warranty
                                </Label>
                            </div>
                            {hasWarranty && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="warrantyDurationMonths">Duration (months)</Label>
                                        <Input
                                            id="warrantyDurationMonths"
                                            type="number"
                                            placeholder="12"
                                            {...register("warrantyDurationMonths", { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="warrantyProvider">Provider</Label>
                                        <Input
                                            id="warrantyProvider"
                                            placeholder="Warranty provider"
                                            {...register("warrantyProvider")}
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
                                    id="hasGuarantee"
                                    checked={hasGuarantee}
                                    onChange={(e) => setHasGuarantee(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="hasGuarantee" className="font-normal">
                                    Has Guarantee
                                </Label>
                            </div>
                            {hasGuarantee && (
                                <div className="space-y-2">
                                    <Label htmlFor="guaranteeDurationMonths">Duration (months)</Label>
                                    <Input
                                        id="guaranteeDurationMonths"
                                        type="number"
                                        placeholder="12"
                                        {...register("guaranteeDurationMonths", { valueAsNumber: true })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedOrgId || !selectedBranchId || !selectedProductId}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Stock"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
