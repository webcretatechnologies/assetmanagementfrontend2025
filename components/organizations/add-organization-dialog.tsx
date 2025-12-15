"use client";

import { useState } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrganization } from "@/store/slices/organizationSlice";
import type { CreateOrganizationInput } from "@/lib/types";

interface AddOrganizationDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AddOrganizationDialog({
    trigger,
    onSuccess,
}: AddOrganizationDialogProps) {
    const [open, setOpen] = useState(false);
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.organizations);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateOrganizationInput>({
        defaultValues: {
            name: "",
            industryType: "",
            ownerEmail: "",
        },
    });

    const onSubmit = async (data: CreateOrganizationInput) => {
        const result = await dispatch(createOrganization(data));
        if (createOrganization.fulfilled.match(result)) {
            reset();
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Organization</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Organization</DialogTitle>
                    <DialogDescription>
                        Create a new organization. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Tech Corp"
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industryType">Industry Type *</Label>
                            <Input
                                id="industryType"
                                placeholder="e.g., Technology, Retail, Finance"
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
                            <Label htmlFor="ownerEmail">Owner Email *</Label>
                            <Input
                                id="ownerEmail"
                                type="email"
                                placeholder="e.g., owner@example.com"
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
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Organization"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
