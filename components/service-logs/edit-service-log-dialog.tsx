"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { useAppDispatch } from "@/store/hooks";
import { updateServiceLog } from "@/store/slices/serviceLogSlice";
import { toast } from "sonner";
import type { ServiceLog, UpdateServiceLogInput, ServiceLogStatus } from "@/lib/types";

interface EditServiceLogDialogProps {
    serviceLog: ServiceLog;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
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
    serviceType: string;
    title: string;
    description?: string;
    performedBy: string;
    scheduledDate?: string;
    completedAt?: string;
    laborCost?: number;
    partsCost?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    status: ServiceLogStatus;
}

export function EditServiceLogDialog({
    serviceLog,
    open,
    onOpenChange,
    onSuccess,
}: EditServiceLogDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceLogFormData>();

    const serviceType = watch("serviceType");
    const status = watch("status");

    // Reset form when serviceLog changes
    useEffect(() => {
        if (serviceLog) {
            reset({
                serviceType: serviceLog.serviceType,
                title: serviceLog.title,
                description: serviceLog.description || "",
                performedBy: serviceLog.performedBy,
                scheduledDate: serviceLog.scheduledDate ? serviceLog.scheduledDate.split("T")[0] : "",
                completedAt: serviceLog.completedAt ? serviceLog.completedAt.split("T")[0] : "",
                laborCost: serviceLog.laborCost,
                partsCost: serviceLog.partsCost,
                invoiceNumber: serviceLog.invoiceNumber || "",
                invoiceDate: serviceLog.invoiceDate ? serviceLog.invoiceDate.split("T")[0] : "",
                notes: serviceLog.notes || "",
                status: serviceLog.status,
            });
        }
    }, [serviceLog, reset]);

    const onSubmit = async (data: ServiceLogFormData) => {
        setIsSubmitting(true);
        try {
            const input: UpdateServiceLogInput = {
                serviceType: data.serviceType,
                title: data.title,
                description: data.description || undefined,
                performedBy: data.performedBy,
                scheduledDate: data.scheduledDate || undefined,
                completedAt: data.completedAt || undefined,
                laborCost: data.laborCost ? Number(data.laborCost) : undefined,
                partsCost: data.partsCost ? Number(data.partsCost) : undefined,
                invoiceNumber: data.invoiceNumber || undefined,
                invoiceDate: data.invoiceDate || undefined,
                notes: data.notes || undefined,
                status: data.status,
            };

            await dispatch(updateServiceLog({ id: serviceLog.id, data: input })).unwrap();
            toast.success("Service log updated successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update service log");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Service Log</DialogTitle>
                    <DialogDescription>
                        Update service log details. Vendor cannot be changed after creation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Vendor Info (Read-only) */}
                    <div className="space-y-2">
                        <Label>Vendor</Label>
                        <Input
                            value={serviceLog.vendor?.name || "Unknown Vendor"}
                            disabled
                            className="bg-muted"
                        />
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
                            <div className="space-y-2">
                                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    {...register("scheduledDate")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="completedAt">Completed Date</Label>
                                <Input
                                    id="completedAt"
                                    type="date"
                                    {...register("completedAt")}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    {...register("description")}
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="partsCost">Parts Cost (₹)</Label>
                                <Input
                                    id="partsCost"
                                    type="number"
                                    {...register("partsCost")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                <Input
                                    id="invoiceNumber"
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
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
