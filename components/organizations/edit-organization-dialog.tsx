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
import { updateOrganization } from "@/store/slices/organizationSlice";
import type { Organization, UpdateOrganizationInput } from "@/lib/types";

interface EditOrganizationDialogProps {
    organization: Organization;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditOrganizationDialog({
    organization,
    open,
    onOpenChange,
    onSuccess,
}: EditOrganizationDialogProps) {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.organizations);
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
        organization.status
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateOrganizationInput>({
        defaultValues: {
            name: organization.name,
            industryType: organization.industryType,
            ownerEmail: organization.ownerEmail,
        },
    });

    useEffect(() => {
        reset({
            name: organization.name,
            industryType: organization.industryType,
            ownerEmail: organization.ownerEmail,
        });
        setStatus(organization.status);
    }, [organization, reset]);

    const onSubmit = async (data: UpdateOrganizationInput) => {
        const result = await dispatch(
            updateOrganization({
                id: organization.id,
                data: { ...data, status },
            })
        );
        if (updateOrganization.fulfilled.match(result)) {
            onOpenChange(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Organization</DialogTitle>
                    <DialogDescription>
                        Update organization details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Organization Name *</Label>
                            <Input
                                id="edit-name"
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-industryType">Industry Type *</Label>
                            <Input
                                id="edit-industryType"
                                {...register("industryType", {
                                    required: "Industry type is required",
                                })}
                            />
                            {errors.industryType && (
                                <p className="text-xs text-destructive">
                                    {errors.industryType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-ownerEmail">Owner Email *</Label>
                            <Input
                                id="edit-ownerEmail"
                                type="email"
                                {...register("ownerEmail", {
                                    required: "Owner email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            {errors.ownerEmail && (
                                <p className="text-xs text-destructive">
                                    {errors.ownerEmail.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                                    setStatus(value)
                                }
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
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
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
            </DialogContent>
        </Dialog>
    );
}
