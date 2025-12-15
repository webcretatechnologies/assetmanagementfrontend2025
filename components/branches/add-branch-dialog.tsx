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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createBranch } from "@/store/slices/branchSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { useAutoSelect } from "@/components/ui/auto-select";
import type { CreateBranchInput } from "@/lib/types";

interface AddBranchDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
}

export function AddBranchDialog({
    trigger,
    onSuccess,
    defaultOrgId,
}: AddBranchDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.branches);
    const { organizations } = useAppSelector((state) => state.organizations);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];

    useEffect(() => {
        if (open && orgList.length === 0) {
            dispatch(fetchOrganizations());
        }
    }, [open, orgList.length, dispatch]);

    // Auto-select organization if only one available
    const activeOrgs = orgList.filter((org) => org.status === "ACTIVE");
    const { shouldDisable: disableOrgSelect } = useAutoSelect(
        activeOrgs,
        selectedOrgId,
        setSelectedOrgId
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Omit<CreateBranchInput, "orgId">>({
        defaultValues: {
            name: "",
            address: "",
        },
    });

    const onSubmit = async (data: Omit<CreateBranchInput, "orgId">) => {
        if (!selectedOrgId) return;

        const result = await dispatch(
            createBranch({ ...data, orgId: selectedOrgId })
        );
        if (createBranch.fulfilled.match(result)) {
            reset();
            setSelectedOrgId(defaultOrgId || "");
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Branch</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Branch</DialogTitle>
                    <DialogDescription>
                        Create a new branch for an organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="orgId">Organization *</Label>
                            <Select
                                value={selectedOrgId}
                                onValueChange={setSelectedOrgId}
                                disabled={disableOrgSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeOrgs.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!selectedOrgId && (
                                <p className="text-xs text-muted-foreground">
                                    Please select an organization
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Branch Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Downtown Branch"
                                {...register("name", { required: "Branch name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                placeholder="e.g., 456 Main Street, City"
                                {...register("address", { required: "Address is required" })}
                            />
                            {errors.address && (
                                <p className="text-xs text-destructive">
                                    {errors.address.message}
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
                        <Button type="submit" disabled={isLoading || !selectedOrgId}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Branch"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
