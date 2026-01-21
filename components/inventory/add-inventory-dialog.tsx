"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Loader2, FileText } from "lucide-react";

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
import { getSuppliers } from "@/lib/api/vendors";
import type { AddInventoryInput, ServiceFrequency, Vendor } from "@/lib/types";

const serviceFrequencies: { value: ServiceFrequency; label: string }[] = [
    { value: "NONE", label: "None" },
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
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
    // Invoice state
    const [hasInvoice, setHasInvoice] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const invoiceFileRef = useRef<HTMLInputElement>(null);
    // Vendor selection state
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");
    const [showVendorTextInput, setShowVendorTextInput] = useState(false);

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

    // Fetch vendors when invoice checkbox is checked
    useEffect(() => {
        if (hasInvoice && selectedOrgId && vendors.length === 0) {
            setIsLoadingVendors(true);
            getSuppliers(selectedOrgId)
                .then(setVendors)
                .catch(() => console.error("Failed to load vendors"))
                .finally(() => setIsLoadingVendors(false));
        }
    }, [hasInvoice, selectedOrgId, vendors.length]);

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
        invoiceNumber: string;
        invoiceDate: string;
        vendorName: string;
        currency: string;
    }>({
        defaultValues: {
            quantity: 1,
            serialNumbers: "",
            serviceInstructions: "",
            warrantyProvider: "",
            warrantyDurationMonths: 12,
            guaranteeDurationMonths: 12,
            invoiceNumber: "",
            invoiceDate: "",
            vendorName: "",
            currency: "",
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
        invoiceNumber: string;
        invoiceDate: string;
        vendorName: string;
        currency: string;
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
            // Invoice fields
            hasInvoice: hasInvoice,
            invoiceNumber: hasInvoice ? data.invoiceNumber : undefined,
            invoiceDate: hasInvoice ? data.invoiceDate : undefined,
            vendorId: hasInvoice && selectedVendorId && selectedVendorId !== "other" ? selectedVendorId : undefined,
            vendorName: hasInvoice && showVendorTextInput ? data.vendorName : undefined,
            currency: hasInvoice ? data.currency : undefined,
        };

        const result = await dispatch(addInventory({ data: payload, invoiceFile: invoiceFile || undefined }));
        if (addInventory.fulfilled.match(result)) {
            reset();
            setSelectedProductId("");
            setRequiresService(false);
            setSelectedServiceFreq("NONE");
            setHasWarranty(false);
            setHasGuarantee(false);
            setPurchaseDate("");
            setHasInvoice(false);
            setInvoiceFile(null);
            setSelectedVendorId("");
            setShowVendorTextInput(false);
            if (invoiceFileRef.current) {
                invoiceFileRef.current.value = "";
            }
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
            <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Inventory Stock</DialogTitle>
                    <DialogDescription>
                        Add new stock to a branch location.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Organization, Branch, Product - Side by Side */}
                        <div className={`grid gap-4 ${canSelectOrg ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
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
                        </div>

                        {/* Quantity and Purchase Date Grid */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    className="w-full text-center"
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
                                    Used for warranty/guarantee expiry
                                </p>
                            </div>
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

                        {/* Invoice Options */}
                        <div className="space-y-3 p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hasInvoice"
                                    checked={hasInvoice}
                                    onChange={(e) => setHasInvoice(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="hasInvoice" className="font-normal">
                                    Has Invoice
                                </Label>
                            </div>
                            {hasInvoice && (
                                <div className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                            <Input
                                                id="invoiceNumber"
                                                placeholder="INV-001"
                                                {...register("invoiceNumber")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="invoiceDate">Invoice Date</Label>
                                            <Input
                                                id="invoiceDate"
                                                type="date"
                                                {...register("invoiceDate")}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Vendor</Label>
                                            <Select
                                                value={selectedVendorId}
                                                onValueChange={(value) => {
                                                    setSelectedVendorId(value);
                                                    setShowVendorTextInput(value === "other");
                                                }}
                                                disabled={isLoadingVendors}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingVendors ? "Loading..." : "Select vendor"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vendors.map((vendor) => (
                                                        <SelectItem key={vendor.id} value={vendor.id}>
                                                            {vendor.name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="other">Vendor not in list...</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {showVendorTextInput && (
                                            <div className="space-y-2">
                                                <Label htmlFor="vendorName">Vendor Name</Label>
                                                <Input
                                                    id="vendorName"
                                                    placeholder="Enter vendor name"
                                                    {...register("vendorName")}
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Input
                                                id="currency"
                                                placeholder="INR"
                                                {...register("currency")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Invoice Attachment</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={invoiceFileRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="invoice-file"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => invoiceFileRef.current?.click()}
                                                className="flex-1"
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                {invoiceFile ? invoiceFile.name : "Choose file"}
                                            </Button>
                                            {invoiceFile && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setInvoiceFile(null);
                                                        if (invoiceFileRef.current) {
                                                            invoiceFileRef.current.value = "";
                                                        }
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Accepts PDF, JPG, PNG (Max 5MB)
                                        </p>
                                    </div>
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
        </Dialog >
    );
}
