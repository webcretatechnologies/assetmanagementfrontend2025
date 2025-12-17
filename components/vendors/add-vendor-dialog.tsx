"use client";

import { useState, ReactNode } from "react";
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
import { useAppDispatch } from "@/store/hooks";
import { createVendor } from "@/store/slices/vendorSlice";
import { toast } from "sonner";
import type { CreateVendorInput, VendorType, VendorCategory, PaymentTerms } from "@/lib/types";

interface AddVendorDialogProps {
    trigger: ReactNode;
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
    vendorType: VendorType;
    category: VendorCategory;
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

export function AddVendorDialog({ trigger, onSuccess }: AddVendorDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<VendorFormData>({
        defaultValues: {
            vendorType: "SUPPLIER",
            category: "OTHER",
        },
    });

    const vendorType = watch("vendorType");
    const category = watch("category");
    const paymentTerms = watch("paymentTerms");

    const onSubmit = async (data: VendorFormData) => {
        setIsSubmitting(true);
        try {
            const input: CreateVendorInput = {
                name: data.name,
                vendorType: data.vendorType,
                category: data.category,
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

            await dispatch(createVendor(input)).unwrap();
            toast.success("Vendor created successfully");
            setOpen(false);
            reset();
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create vendor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Vendor</DialogTitle>
                    <DialogDescription>
                        Add a new supplier or service provider to your organization.
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
                                    placeholder="Acme Supplies"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendorType">Vendor Type *</Label>
                                <Select
                                    value={vendorType}
                                    onValueChange={(value: VendorType) => setValue("vendorType", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUPPLIER">Supplier</SelectItem>
                                        <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                    placeholder="John Smith"
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
                                    placeholder="contact@vendor.com"
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
                                    placeholder="+91 98765 43210"
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
                                    placeholder="+91 98765 43211"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    {...register("website")}
                                    placeholder="https://www.vendor.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Address (Optional)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="addressLine1">Address Line 1</Label>
                                <Input
                                    id="addressLine1"
                                    {...register("addressLine1")}
                                    placeholder="123 Business Road"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="addressLine2">Address Line 2</Label>
                                <Input
                                    id="addressLine2"
                                    {...register("addressLine2")}
                                    placeholder="Suite 100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    {...register("city")}
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    {...register("state")}
                                    placeholder="Maharashtra"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    {...register("postalCode")}
                                    placeholder="400001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    {...register("country")}
                                    placeholder="India"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Tax & Financial (Optional)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber">GST Number</Label>
                                <Input
                                    id="gstNumber"
                                    {...register("gstNumber")}
                                    placeholder="27AABCU9603R1ZM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="panNumber">PAN Number</Label>
                                <Input
                                    id="panNumber"
                                    {...register("panNumber")}
                                    placeholder="ABCDE1234F"
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
                            placeholder="Additional notes about this vendor..."
                            rows={3}
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Vendor"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
