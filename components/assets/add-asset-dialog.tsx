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

interface AssetFormData {
    name: string;
    category: string;
    serialNumber: string;
    purchaseDate: string;
    purchasePrice: string;
    location: string;
    description: string;
}

interface AddAssetDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AddAssetDialog({ trigger, onSuccess }: AddAssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssetFormData>({
        defaultValues: {
            name: "",
            category: "",
            serialNumber: "",
            purchaseDate: "",
            purchasePrice: "",
            location: "",
            description: "",
        },
    });

    const onSubmit = async (data: AssetFormData) => {
        setIsLoading(true);
        // TODO: Integrate with asset API when available
        console.log("Asset data:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
        reset();
        setOpen(false);
        onSuccess?.();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Asset</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        Register a new asset to your inventory.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="asset-name">Asset Name *</Label>
                                <Input
                                    id="asset-name"
                                    placeholder="e.g., MacBook Pro"
                                    {...register("name", { required: "Asset name is required" })}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="asset-category">Category *</Label>
                                <Input
                                    id="asset-category"
                                    placeholder="e.g., Electronics"
                                    {...register("category", { required: "Category is required" })}
                                />
                                {errors.category && (
                                    <p className="text-xs text-destructive">
                                        {errors.category.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="asset-serial">Serial Number</Label>
                                <Input
                                    id="asset-serial"
                                    placeholder="e.g., ABC123XYZ"
                                    {...register("serialNumber")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="asset-date">Purchase Date</Label>
                                <Input
                                    id="asset-date"
                                    type="date"
                                    {...register("purchaseDate")}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="asset-price">Purchase Price</Label>
                                <Input
                                    id="asset-price"
                                    placeholder="e.g., 2499.00"
                                    {...register("purchasePrice")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="asset-location">Location *</Label>
                                <Input
                                    id="asset-location"
                                    placeholder="e.g., Office A"
                                    {...register("location", { required: "Location is required" })}
                                />
                                {errors.location && (
                                    <p className="text-xs text-destructive">
                                        {errors.location.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="asset-description">Description</Label>
                            <textarea
                                id="asset-description"
                                placeholder="Additional details about the asset..."
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Asset"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
