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
import { createCategory } from "@/store/slices/categorySlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { useAutoSelect } from "@/components/ui/auto-select";
import type { CreateCategoryInput } from "@/lib/types";

interface AddCategoryDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
}

export function AddCategoryDialog({
    trigger,
    onSuccess,
    defaultOrgId,
}: AddCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.categories);
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

    useEffect(() => {
        if (defaultOrgId) {
            setSelectedOrgId(defaultOrgId);
        }
    }, [defaultOrgId]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Omit<CreateCategoryInput, "organizationId">>({
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const onSubmit = async (data: Omit<CreateCategoryInput, "organizationId">) => {
        if (!selectedOrgId) return;

        const payload: CreateCategoryInput = {
            ...data,
            organizationId: selectedOrgId,
        };

        const result = await dispatch(createCategory(payload));
        if (createCategory.fulfilled.match(result)) {
            reset();
            setSelectedOrgId(defaultOrgId || "");
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Category</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                    <DialogDescription>
                        Create a new category for an organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="organizationId">Organization *</Label>
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Electronics"
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Electronic devices and accessories"
                                rows={3}
                                {...register("description")}
                            />
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
                                "Create Category"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
