"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
import { createUser } from "@/store/slices/userSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { getAssignableRoles, ROLE_DISPLAY_NAMES } from "@/lib/rbac";
import { useAutoSelect } from "@/components/ui/auto-select";
import type { CreateUserInput, UserRole } from "@/lib/types";

interface AddUserDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
}

export function AddUserDialog({
    trigger,
    onSuccess,
    defaultOrgId,
}: AddUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.users);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { user: currentUser } = useAppSelector((state) => state.auth);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];

    // Get roles the current user can assign based on their permissions
    const assignableRoles = getAssignableRoles(currentUser?.role);
    const roleOptions = assignableRoles.map((role) => ({
        value: role as UserRole,
        label: ROLE_DISPLAY_NAMES[role] || role,
    }));

    // Default to the first assignable role or INVENTORY_OPERATOR if available
    const defaultRole = assignableRoles.includes("INVENTORY_OPERATOR")
        ? "INVENTORY_OPERATOR"
        : assignableRoles[0] || "INVENTORY_OPERATOR";
    const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole as UserRole);

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
        if (selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
            setSelectedBranchId("");
        }
    }, [selectedOrgId, dispatch]);

    // Check if the SELECTED role is Super Admin or Org Admin - for those roles, branch is optional
    const isBranchOptional = selectedRole === "SUPER_ADMIN" || selectedRole === "ORG_ADMIN";

    // Auto-select branch if only one available
    const { shouldDisable: disableBranchSelect } = useAutoSelect(
        branchList,
        selectedBranchId,
        setSelectedBranchId
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Omit<CreateUserInput, "orgId" | "role" | "branchId">>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: Omit<CreateUserInput, "orgId" | "role" | "branchId">) => {
        if (!selectedOrgId) return;

        const payload: CreateUserInput = {
            ...data,
            orgId: selectedOrgId,
            role: selectedRole,
            ...(selectedBranchId && { branchId: selectedBranchId }),
        };

        const result = await dispatch(createUser(payload));
        if (createUser.fulfilled.match(result)) {
            reset();
            setSelectedOrgId(defaultOrgId || "");
            setSelectedBranchId("");
            setSelectedRole("INVENTORY_OPERATOR");
            setShowPassword(false);
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add User</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                        Create a new user for an organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Jane"
                                    {...register("firstName", { required: "First name is required" })}
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Smith"
                                    {...register("lastName", { required: "Last name is required" })}
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jane@example.com"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pr-10"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 8,
                                            message: "Password must be at least 8 characters",
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>

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
                        </div>

                        {/* Branch - Optional for Super Admin and Org Admin, Required for all other roles */}
                        <div className="space-y-2">
                            <Label htmlFor="branchId">
                                Branch {isBranchOptional ? "(Optional)" : "*"}
                            </Label>
                            <Select
                                value={selectedBranchId}
                                onValueChange={setSelectedBranchId}
                                disabled={!selectedOrgId || disableBranchSelect}
                            >
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
                            {!isBranchOptional && !selectedBranchId && (
                                <p className="text-xs text-muted-foreground">
                                    Branch is required for this role
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) => setSelectedRole(value as UserRole)}
                                disabled={roleOptions.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {roleOptions.length === 0 && (
                                <p className="text-xs text-destructive">
                                    You don&apos;t have permission to create users
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
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                !selectedOrgId ||
                                (!isBranchOptional && !selectedBranchId)
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create User"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
