"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Search } from "lucide-react";

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
import { createAssignment, fetchAvailableAssets } from "@/store/slices/assignmentSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { fetchUsersByOrg } from "@/store/slices/userSlice";
import type { CreateAssignmentInput } from "@/lib/types";

interface AssignAssetDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
    defaultBranchId?: string;
}

const conditions = ["Excellent", "Good", "Fair", "Poor"];

export function AssignAssetDialog({
    trigger,
    onSuccess,
    defaultOrgId,
    defaultBranchId,
}: AssignAssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || "");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedCondition, setSelectedCondition] = useState("Excellent");
    const [assetSearch, setAssetSearch] = useState("");

    const dispatch = useAppDispatch();
    const { isLoading, availableAssets } = useAppSelector((state) => state.assignments);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { users } = useAppSelector((state) => state.users);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];
    const userList = Array.isArray(users) ? users : [];
    const assetList = Array.isArray(availableAssets) ? availableAssets : [];

    useEffect(() => {
        if (open && orgList.length === 0) {
            dispatch(fetchOrganizations());
        }
    }, [open, orgList.length, dispatch]);

    useEffect(() => {
        if (selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
            dispatch(fetchUsersByOrg({ orgId: selectedOrgId }));
        }
    }, [selectedOrgId, dispatch]);

    // Reset selections when org changes (but not on initial mount)
    const [isInitialMount, setIsInitialMount] = useState(true);
    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }
        if (selectedOrgId) {
            setSelectedBranchId("");
            setSelectedUserId("");
            setSelectedProductId("");
            setAssetSearch("");
        }
    }, [selectedOrgId]);

    // Fetch available assets when dialog opens or filters change
    useEffect(() => {
        if (selectedBranchId && selectedOrgId) {
            dispatch(fetchAvailableAssets({
                organizationId: selectedOrgId,
                branchId: selectedBranchId,
                search: assetSearch || undefined,
            }));
        }
    }, [selectedBranchId, selectedOrgId, assetSearch, dispatch]);

    useEffect(() => {
        if (defaultOrgId) setSelectedOrgId(defaultOrgId);
        if (defaultBranchId) setSelectedBranchId(defaultBranchId);
    }, [defaultOrgId, defaultBranchId]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ serialNumber: string; purpose: string; notes: string }>({
        defaultValues: { serialNumber: "", purpose: "", notes: "" },
    });

    const selectedAsset = assetList.find((a) => a.id === selectedProductId);

    const onSubmit = async (data: { serialNumber: string; purpose: string; notes: string }) => {
        if (!selectedUserId || !selectedProductId || !selectedAsset) return;

        const payload: CreateAssignmentInput = {
            productId: selectedAsset.productId, // Use the product ID from the inventory item
            userId: selectedUserId,
            organizationId: selectedOrgId,
            branchId: selectedBranchId,
            // Use serialNumber from inventory item or from form if product is serialized
            serialNumber: selectedAsset.serialNumber || (selectedAsset.product.isSerialized ? data.serialNumber : undefined),
            conditionOnIssue: selectedCondition,
            purpose: data.purpose || undefined,
            notes: data.notes || undefined,
        };

        const result = await dispatch(createAssignment(payload));
        if (createAssignment.fulfilled.match(result)) {
            reset();
            setSelectedUserId("");
            setSelectedProductId("");
            setSelectedCondition("Excellent");
            setAssetSearch("");
            setOpen(false);
            onSuccess?.();
        }
    };

    const activeUsers = userList.filter((u) => u.status === "ACTIVE");
    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Assign Asset</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Asset</DialogTitle>
                    <DialogDescription>Assign an available asset to a user.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Organization, Branch, Assign To - 3 column grid */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* Organization */}
                            <div className="space-y-2">
                                <Label>Organization *</Label>
                                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations
                                            .filter((org) => org.status === "ACTIVE")
                                            .map((org) => (
                                                <SelectItem key={org.id} value={org.id}>
                                                    {org.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Branch */}
                            <div className="space-y-2">
                                <Label>Branch *</Label>
                                <Select
                                    value={selectedBranchId}
                                    onValueChange={setSelectedBranchId}
                                    disabled={!selectedOrgId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeBranches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* User / Assign To */}
                            <div className="space-y-2">
                                <Label>Assign To *</Label>
                                <Select
                                    value={selectedUserId}
                                    onValueChange={setSelectedUserId}
                                    disabled={!selectedOrgId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Asset */}
                        <div className="space-y-2">
                            <Label>Asset *</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by serial, name, or SKU..."
                                    value={assetSearch}
                                    onChange={(e) => setAssetSearch(e.target.value)}
                                    className="pl-8 mb-2"
                                    disabled={!selectedOrgId}
                                />
                            </div>
                            <Select
                                value={selectedProductId}
                                onValueChange={setSelectedProductId}
                                disabled={!selectedOrgId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select available asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assetList.map((asset) => (
                                        <SelectItem key={asset.id} value={asset.id}>
                                            <span className="font-medium">{asset.product.sku}</span>
                                            <span className="text-muted-foreground"> - {asset.product.name}</span>
                                            {asset.serialNumber && (
                                                <span className="text-xs text-primary ml-1">
                                                    [SN: {asset.serialNumber}]
                                                </span>
                                            )}
                                            {asset.product.category && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({asset.product.category.name})
                                                </span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {assetList.length === 0 && selectedOrgId && (
                                <p className="text-xs text-muted-foreground">
                                    No available assets found{assetSearch && ` for "${assetSearch}"`}
                                </p>
                            )}
                        </div>

                        {/* Serial Number - show only if product is serialized AND no serial number from inventory */}
                        {selectedAsset?.product.isSerialized && !selectedAsset?.serialNumber && (
                            <div className="space-y-2">
                                <Label htmlFor="serialNumber">Serial Number *</Label>
                                <Input
                                    id="serialNumber"
                                    placeholder="SN123456"
                                    {...register("serialNumber", {
                                        required: selectedAsset?.product.isSerialized && !selectedAsset?.serialNumber
                                            ? "Serial number is required"
                                            : false,
                                    })}
                                />
                                {errors.serialNumber && (
                                    <p className="text-xs text-destructive">{errors.serialNumber.message}</p>
                                )}
                            </div>
                        )}

                        {/* Condition */}
                        <div className="space-y-2">
                            <Label>Condition on Issue</Label>
                            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {conditions.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Purpose */}
                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose</Label>
                            <Input
                                id="purpose"
                                placeholder="Work laptop for remote employee"
                                {...register("purpose")}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Additional notes" rows={2} {...register("notes")} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                !selectedOrgId ||
                                !selectedBranchId ||
                                !selectedUserId ||
                                !selectedProductId
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                "Assign Asset"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
