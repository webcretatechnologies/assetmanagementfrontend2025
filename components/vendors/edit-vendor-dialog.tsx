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
import { updateVendor } from "@/store/slices/vendorSlice";
import { toast } from "sonner";
import type { Vendor, UpdateVendorInput, VendorCategory, VendorStatus, PaymentTerms } from "@/lib/types";

interface EditVendorDialogProps {
    vendor: Vendor;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const VENDOR_CATEGORIES: { value: VendorCategory; label: string }[] = [
    { value: "IT_HARDWARE", label: "IT Hardware" },
    { value: "HVAC", label: "HVAC" },
    { value: "ELECTRICAL", label: "Electrical" },
    { value: "PLUMBING", label: "Plumbing" },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "FURNITURE", label: "Furniture" },
    { value: "SECURITY", label: "Security" },
    { value: "ELECTRONICS", label: "Electronics" },
    { value: "MACHINERY", label: "Machinery" },
    { value: "VEHICLES", label: "Vehicles" },
    { value: "CLEANING", label: "Cleaning" },
    { value: "GENERAL_MAINTENANCE", label: "General Maintenance" },
    { value: "OTHER", label: "Other" },
];

const PAYMENT_TERMS: { value: PaymentTerms; label: string }[] = [
    { value: "IMMEDIATE", label: "Due on Receipt" },
    { value: "NET_7", label: "Net 7 Days" },
    { value: "NET_15", label: "Net 15 Days" },
    { value: "NET_30", label: "Net 30 Days" },
    { value: "NET_45", label: "Net 45 Days" },
    { value: "NET_60", label: "Net 60 Days" },
    { value: "ADVANCE", label: "Advance Payment" },
    { value: "CUSTOM", label: "Custom" },
];

interface VendorFormData {
    name: string;
    category: VendorCategory;
    status: VendorStatus;
    contactPerson: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstNumber?: string;
    panNumber?: string;
    paymentTerms?: PaymentTerms;
    notes?: string;
}

export function EditVendorDialog({ vendor, open, onOpenChange, onSuccess }: EditVendorDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<VendorFormData>();

    const category = watch("category");
    const status = watch("status");
    const paymentTerms = watch("paymentTerms");

    // Reset form when vendor changes
    useEffect(() => {
        if (vendor) {
            reset({
                name: vendor.name,
                category: vendor.category,
                status: vendor.status,
                contactPerson: vendor.contactPerson,
                email: vendor.email,
                phone: vendor.phone,
                alternatePhone: vendor.alternatePhone || "",
                website: vendor.website || "",
                addressLine1: vendor.addressLine1 || "",
                addressLine2: vendor.addressLine2 || "",
                city: vendor.city || "",
                state: vendor.state || "",
                postalCode: vendor.postalCode || "",
                country: vendor.country || "",
                gstNumber: vendor.gstNumber || "",
                panNumber: vendor.panNumber || "",
                paymentTerms: vendor.paymentTerms,
                notes: vendor.notes || "",
            });
        }
    }, [vendor, reset]);

    const onSubmit = async (data: VendorFormData) => {
        setIsSubmitting(true);
        try {
            const input: UpdateVendorInput = {
                name: data.name,
                category: data.category,
                status: data.status,
                contactPerson: data.contactPerson,
                email: data.email,
                phone: data.phone,
                alternatePhone: data.alternatePhone || undefined,
                website: data.website || undefined,
                addressLine1: data.addressLine1 || undefined,
                addressLine2: data.addressLine2 || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                postalCode: data.postalCode || undefined,
                country: data.country || undefined,
                gstNumber: data.gstNumber || undefined,
                panNumber: data.panNumber || undefined,
                paymentTerms: data.paymentTerms || undefined,
                notes: data.notes || undefined,
            };

            await dispatch(updateVendor({ id: vendor.id, data: input })).unwrap();
            toast.success("Vendor updated successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update vendor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Vendor</DialogTitle>
                    <DialogDescription>
                        Update vendor information. Vendor type cannot be changed after creation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Vendor Name *</Label>
                                <Input
                                    id="name"
                                    {...register("name", { required: "Vendor name is required" })}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor Type</Label>
                                <Input
                                    value={vendor.vendorType === "SUPPLIER" ? "Supplier" : "Service Provider"}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={category}
                                    onValueChange={(value: VendorCategory) => setValue("category", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VENDOR_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value: VendorStatus) => setValue("status", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person *</Label>
                                <Input
                                    id="contactPerson"
                                    {...register("contactPerson", { required: "Contact person is required" })}
                                />
                                {errors.contactPerson && (
                                    <p className="text-sm text-destructive">{errors.contactPerson.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Invalid email address",
                                        },
                                    })}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    {...register("phone", { required: "Phone is required" })}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                                <Input
                                    id="alternatePhone"
                                    {...register("alternatePhone")}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    {...register("website")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="addressLine1">Address Line 1</Label>
                                <Input
                                    id="addressLine1"
                                    {...register("addressLine1")}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="addressLine2">Address Line 2</Label>
                                <Input
                                    id="addressLine2"
                                    {...register("addressLine2")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    {...register("city")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    {...register("state")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    {...register("postalCode")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    {...register("country")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Tax & Financial</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber">GST Number</Label>
                                <Input
                                    id="gstNumber"
                                    {...register("gstNumber")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="panNumber">PAN Number</Label>
                                <Input
                                    id="panNumber"
                                    {...register("panNumber")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentTerms">Payment Terms</Label>
                                <Select
                                    value={paymentTerms || ""}
                                    onValueChange={(value: PaymentTerms) => setValue("paymentTerms", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment terms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_TERMS.map((term) => (
                                            <SelectItem key={term.value} value={term.value}>
                                                {term.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            rows={3}
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
