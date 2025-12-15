"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, AlertTriangle } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { transferInventory, fetchInventory } from "@/store/slices/inventorySlice";
import { fetchActiveBranches } from "@/store/slices/branchSlice";
import { canTransferInventory, canSelectSourceBranch } from "@/lib/rbac";
import type { TransferInventoryInput } from "@/lib/types";

interface TransferInventoryDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    organizationId: string;
}

export function TransferInventoryDialog({
    trigger,
    onSuccess,
    organizationId,
}: TransferInventoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [sourceBranchId, setSourceBranchId] = useState("");
    const [targetBranchId, setTargetBranchId] = useState("");
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState("");

    const dispatch = useAppDispatch();
    const { isLoading, items } = useAppSelector((state) => state.inventory);
    const { activeBranches } = useAppSelector((state) => state.branches);
    const { user } = useAppSelector((state) => state.auth);

    const userRole = user?.role;
    const userBranchId = user?.branchId;

    // Role-based access control
    const canTransfer = canTransferInventory(userRole);
    const canSelectSource = canSelectSourceBranch(userRole);

    useEffect(() => {
        if (open) {
            dispatch(fetchActiveBranches());
        }
    }, [open, dispatch]);

    // Auto-select user's branch for non-admin roles
    useEffect(() => {
        if (open && !canSelectSource && userBranchId) {
            setSourceBranchId(userBranchId);
        }
    }, [open, canSelectSource, userBranchId]);

    // Fetch inventory when source branch is selected
    useEffect(() => {
        if (sourceBranchId && organizationId) {
            dispatch(fetchInventory({
                organizationId,
                branchId: sourceBranchId,
                status: "AVAILABLE",
                limit: 100
            }));
            setSelectedInventoryItemId("");
        }
    }, [sourceBranchId, organizationId, dispatch]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            if (canSelectSource) {
                setSourceBranchId("");
            }
            setTargetBranchId("");
            setSelectedInventoryItemId("");
        }
    }, [open, canSelectSource]);

    const onSubmit = async () => {
        if (!sourceBranchId || !targetBranchId || !selectedInventoryItemId) return;

        const payload: TransferInventoryInput = {
            organizationId,
            inventoryItemId: selectedInventoryItemId,
            toBranchId: targetBranchId,
        };

        const result = await dispatch(transferInventory(payload));
        if (transferInventory.fulfilled.match(result)) {
            setTargetBranchId("");
            setSelectedInventoryItemId("");
            setOpen(false);
            onSuccess?.();
        }
    };

    const targetBranches = activeBranches.filter((b) => b.id !== sourceBranchId);

    // Ensure items is always an array
    const itemList = Array.isArray(items) ? items : [];

    // Filter available items from the source branch
    const availableItems = itemList.filter(
        (item) => item.branchId === sourceBranchId && item.status === "AVAILABLE"
    );

    // Get source branch name for display
    const sourceBranchName = activeBranches.find((b) => b.id === sourceBranchId)?.name;

    // If user cannot transfer, show access denied
    if (!canTransfer) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || <Button variant="outline" disabled>Transfer</Button>}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Access Denied</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Unauthorized</AlertTitle>
                        <AlertDescription>
                            You do not have permission to transfer inventory.
                            This action is restricted to Branch Managers, Inventory Operators, and Administrators.
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Transfer</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Transfer Inventory</DialogTitle>
                    <DialogDescription>
                        Move an inventory item to another branch location.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Source Branch */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            Source Branch *
                            {!canSelectSource && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        {canSelectSource ? (
                            <Select value={sourceBranchId} onValueChange={setSourceBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeBranches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={sourceBranchName || "Loading..."}
                                disabled
                                className="bg-muted"
                            />
                        )}
                        {!canSelectSource && (
                            <p className="text-xs text-muted-foreground">
                                Your branch is auto-selected based on your assignment
                            </p>
                        )}
                    </div>

                    {/* Inventory Item */}
                    <div className="space-y-2">
                        <Label>Inventory Item *</Label>
                        <Select
                            value={selectedInventoryItemId}
                            onValueChange={setSelectedInventoryItemId}
                            disabled={!sourceBranchId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select item to transfer" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        <div className="flex flex-col">
                                            <span>{item.product?.name || "Unknown Product"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.serialNumber || `Qty: ${item.quantity}`} - {item.product?.sku}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {sourceBranchId && availableItems.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No available items in this branch
                            </p>
                        )}
                    </div>

                    {/* Target Branch */}
                    <div className="space-y-2">
                        <Label>Target Branch *</Label>
                        <Select
                            value={targetBranchId}
                            onValueChange={setTargetBranchId}
                            disabled={!sourceBranchId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select target branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {targetBranches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {sourceBranchId && targetBranches.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No other branches available for transfer
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={
                            isLoading ||
                            !sourceBranchId ||
                            !targetBranchId ||
                            !selectedInventoryItemId
                        }
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            "Transfer"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
