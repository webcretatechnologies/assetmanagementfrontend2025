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
import { updateUser } from "@/store/slices/userSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { getAssignableRoles, ROLE_DISPLAY_NAMES } from "@/lib/rbac";
import type { User, UpdateUserInput, UserRole, UserStatus } from "@/lib/types";

// Statuses remain static
const statuses: { value: UserStatus; label: string }[] = [
    { value: "ACTIVE", label: "Active" },
    { value: "INVITED", label: "Invited" },
    { value: "DISABLED", label: "Disabled" },
];

interface EditUserDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditUserDialog({
    user,
    open,
    onOpenChange,
    onSuccess,
}: EditUserDialogProps) {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.users);
    const { branches } = useAppSelector((state) => state.branches);
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const [selectedBranchId, setSelectedBranchId] = useState(user.branchId || "");
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
    const [selectedStatus, setSelectedStatus] = useState<UserStatus>(user.status);

    // Ensure arrays are always arrays
    const branchList = Array.isArray(branches) ? branches : [];

    // Get roles the current user can assign based on their permissions
    const assignableRoles = getAssignableRoles(currentUser?.role);
    const roleOptions = assignableRoles.map((role) => ({
        value: role as UserRole,
        label: ROLE_DISPLAY_NAMES[role] || role,
    }));

    // Check if current user can change this user's role
    const canChangeRole = roleOptions.length > 0 && assignableRoles.includes(user.role);

    useEffect(() => {
        if (open && user.orgId) {
            dispatch(fetchBranchesByOrg(user.orgId));
        }
    }, [open, user.orgId, dispatch]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateUserInput>({
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
        },
    });

    useEffect(() => {
        reset({
            firstName: user.firstName,
            lastName: user.lastName,
        });
        setSelectedBranchId(user.branchId || "");
        setSelectedRole(user.role);
        setSelectedStatus(user.status);
    }, [user, reset]);

    const onSubmit = async (data: UpdateUserInput) => {
        const payload: UpdateUserInput = {
            ...data,
            role: selectedRole,
            status: selectedStatus,
            ...(selectedBranchId && { branchId: selectedBranchId }),
        };

        const result = await dispatch(updateUser({ id: user.id, data: payload }));
        if (updateUser.fulfilled.match(result)) {
            onOpenChange(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update user details below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-firstName">First Name *</Label>
                                <Input
                                    id="edit-firstName"
                                    {...register("firstName", { required: "First name is required" })}
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-lastName">Last Name *</Label>
                                <Input
                                    id="edit-lastName"
                                    {...register("lastName", { required: "Last name is required" })}
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-branchId">Branch</Label>
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branchList.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                                    disabled={!canChangeRole}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.length > 0 ? (
                                            roleOptions.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value={user.role} disabled>
                                                {ROLE_DISPLAY_NAMES[user.role] || user.role}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {!canChangeRole && (
                                    <p className="text-xs text-muted-foreground">
                                        You don&apos;t have permission to change this role
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(value) => setSelectedStatus(value as UserStatus)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
