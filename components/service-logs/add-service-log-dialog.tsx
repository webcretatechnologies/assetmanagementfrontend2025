"use client";

import { useState, ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createServiceLog } from "@/store/slices/serviceLogSlice";
import { getServiceProviders } from "@/lib/api/vendors";
import { toast } from "sonner";
import type { CreateServiceLogInput, ServiceLogStatus, Vendor, Branch } from "@/lib/types";

interface AddServiceLogDialogProps {
    trigger: ReactNode;
    onSuccess?: () => void;
    defaultVendorId?: string;
    defaultInventoryItemId?: string;
    defaultRequestId?: string;
    defaultBranchId?: string;
}

const SERVICE_TYPES = [
    "Repair",
    "Maintenance",
    "Installation",
    "Inspection",
    "Replacement",
    "Cleaning",
    "Calibration",
    "Other",
];

interface ServiceLogFormData {
    vendorId: string;
    branchId: string;
    inventoryItemId?: string;
    requestId?: string;
    serviceType: string;
    title: string;
    description?: string;
    performedBy: string;
    scheduledDate?: string;
    laborCost?: number;
    partsCost?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    status: ServiceLogStatus;
    completedAt?: string;
}

export function AddServiceLogDialog({
    trigger,
    onSuccess,
    defaultVendorId,
    defaultInventoryItemId,
    defaultRequestId,
    defaultBranchId,
}: AddServiceLogDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    // Check if user has a fixed branch or needs to select one
    const userHasFixedBranch = !!user?.branchId;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceLogFormData>({
        defaultValues: {
            vendorId: defaultVendorId || "",
            inventoryItemId: defaultInventoryItemId || "",
            requestId: defaultRequestId || "",
            branchId: defaultBranchId || user?.branchId || "",
            serviceType: "Repair",
            status: "COMPLETED",
        },
    });

    const vendorId = watch("vendorId");
    const branchId = watch("branchId");
    const serviceType = watch("serviceType");
    const status = watch("status");

    // Set branchId when dialog opens and user is available
    useEffect(() => {
        if (open) {
            if (defaultBranchId) {
                setValue("branchId", defaultBranchId);
            } else if (user?.branchId) {
                setValue("branchId", user.branchId);
            }
        }
    }, [open, user?.branchId, defaultBranchId, setValue]);

    // Fetch service providers when dialog opens
    useEffect(() => {
        if (open) {
            setIsLoadingVendors(true);
            getServiceProviders(user?.orgId)
                .then(setVendors)
                .catch(() => toast.error("Failed to load vendors"))
                .finally(() => setIsLoadingVendors(false));

            // Fetch branches if user doesn't have a fixed branch
            if (!userHasFixedBranch) {
                setIsLoadingBranches(true);
                import("@/lib/api/branches").then(({ getBranches }) => {
                    getBranches({ orgId: user?.orgId })
                        .then((res) => setBranches(Array.isArray(res) ? res : res.data || []))
                        .catch(() => toast.error("Failed to load branches"))
                        .finally(() => setIsLoadingBranches(false));
                });
            }
        }
    }, [open, user?.orgId, userHasFixedBranch]);

    const onSubmit = async (data: ServiceLogFormData) => {
        setIsSubmitting(true);
        try {
            const input: CreateServiceLogInput = {
                branchId: data.branchId || user?.branchId || "",
                vendorId: data.vendorId,
                inventoryItemId: data.inventoryItemId || undefined,
                requestId: data.requestId || undefined,
                serviceType: data.serviceType,
                title: data.title,
                description: data.description || undefined,
                performedBy: data.performedBy,
                scheduledDate: data.scheduledDate || undefined,
                laborCost: data.laborCost ? Number(data.laborCost) : undefined,
                partsCost: data.partsCost ? Number(data.partsCost) : undefined,
                invoiceNumber: data.invoiceNumber || undefined,
                invoiceDate: data.invoiceDate || undefined,
                notes: data.notes || undefined,
                status: data.status,
                completedAt: data.status === "COMPLETED" ? (data.completedAt || new Date().toISOString()) : undefined,
            };

            await dispatch(createServiceLog(input)).unwrap();
            toast.success("Service log created successfully");
            setOpen(false);
            reset();
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create service log");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Service</DialogTitle>
                    <DialogDescription>
                        Record a maintenance or repair service performed by a vendor.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Service Provider & Branch */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Service Provider</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`space-y-2 ${userHasFixedBranch ? "sm:col-span-2" : ""}`}>
                                <Label htmlFor="vendorId">Vendor *</Label>
                                <Select
                                    value={vendorId}
                                    onValueChange={(value) => setValue("vendorId", value)}
                                    disabled={isLoadingVendors}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select vendor"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!vendorId && (
                                    <p className="text-xs text-muted-foreground">
                                        Only service provider vendors are shown
                                    </p>
                                )}
                            </div>
                            {!userHasFixedBranch && (
                                <div className="space-y-2">
                                    <Label htmlFor="branchId">Branch *</Label>
                                    <Select
                                        value={branchId}
                                        onValueChange={(value) => setValue("branchId", value)}
                                        disabled={isLoadingBranches}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select branch"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Service Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Service Title *</Label>
                                <Input
                                    id="title"
                                    {...register("title", { required: "Title is required" })}
                                    placeholder="Screen Replacement"
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="serviceType">Service Type *</Label>
                                <Select
                                    value={serviceType}
                                    onValueChange={(value) => setValue("serviceType", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="performedBy">Technician Name *</Label>
                                <Input
                                    id="performedBy"
                                    {...register("performedBy", { required: "Technician name is required" })}
                                    placeholder="John Doe"
                                />
                                {errors.performedBy && (
                                    <p className="text-sm text-destructive">{errors.performedBy.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value: ServiceLogStatus) => setValue("status", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    {...register("description")}
                                    placeholder="Detailed description of the service performed..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cost Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Cost Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                                <Input
                                    id="laborCost"
                                    type="number"
                                    {...register("laborCost")}
                                    placeholder="500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="partsCost">Parts Cost (₹)</Label>
                                <Input
                                    id="partsCost"
                                    type="number"
                                    {...register("partsCost")}
                                    placeholder="1500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                <Input
                                    id="invoiceNumber"
                                    {...register("invoiceNumber")}
                                    placeholder="INV-2024-001"
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
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            placeholder="Any additional notes..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !vendorId}>
                            {isSubmitting ? "Saving..." : "Log Service"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
