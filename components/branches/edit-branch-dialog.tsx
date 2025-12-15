"use client";

import { useEffect } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateBranch } from "@/store/slices/branchSlice";
import type { Branch, UpdateBranchInput } from "@/lib/types";

interface EditBranchDialogProps {
    branch: Branch;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditBranchDialog({
    branch,
    open,
    onOpenChange,
    onSuccess,
}: EditBranchDialogProps) {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.branches);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateBranchInput>({
        defaultValues: {
            name: branch.name,
            address: branch.address,
        },
    });

    useEffect(() => {
        reset({
            name: branch.name,
            address: branch.address,
        });
    }, [branch, reset]);

    const onSubmit = async (data: UpdateBranchInput) => {
        const result = await dispatch(
            updateBranch({
                id: branch.id,
                data,
            })
        );
        if (updateBranch.fulfilled.match(result)) {
            onOpenChange(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Branch</DialogTitle>
                    <DialogDescription>Update branch details below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-branch-name">Branch Name *</Label>
                            <Input
                                id="edit-branch-name"
                                {...register("name", { required: "Branch name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-branch-address">Address *</Label>
                            <Input
                                id="edit-branch-address"
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
