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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProduct } from "@/store/slices/productSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import type {
    Product,
    UpdateProductInput,
    ProductType,
    ProductStatus,
} from "@/lib/types";

interface EditProductDialogProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const productTypes: { value: ProductType; label: string }[] = [
    { value: "ASSET", label: "Asset" },
    { value: "CONSUMABLE", label: "Consumable" },
];

const statuses: { value: ProductStatus; label: string }[] = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
];

export function EditProductDialog({
    product,
    open,
    onOpenChange,
    onSuccess,
}: EditProductDialogProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState(product.categoryId);
    const [selectedProductType, setSelectedProductType] = useState<ProductType>(product.productType);
    const [selectedStatus, setSelectedStatus] = useState<ProductStatus>(product.status);

    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.products);
    const { categories } = useAppSelector((state) => state.categories);

    // Ensure arrays are always arrays
    const categoryList = Array.isArray(categories) ? categories : [];

    useEffect(() => {
        if (open && product.organizationId) {
            dispatch(fetchCategories({ organizationId: product.organizationId }));
        }
    }, [open, product.organizationId, dispatch]);

    useEffect(() => {
        if (open && product) {
            setSelectedCategoryId(product.categoryId);
            setSelectedProductType(product.productType);
            setSelectedStatus(product.status);
            reset({
                name: product.name,
                brand: product.brand || "",
                model: product.model || "",
                description: product.description || "",
                uom: product.uom || "pcs",
                unitCost: Number(product.unitCost) || 0,
                reorderLevel: product.reorderLevel || 0,
            });
        }
    }, [open, product]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateProductInput>({
        defaultValues: {
            name: product.name,
            brand: product.brand || "",
            model: product.model || "",
            description: product.description || "",
            uom: product.uom || "pcs",
            unitCost: Number(product.unitCost) || 0,
            reorderLevel: product.reorderLevel || 0,
        },
    });

    const onSubmit = async (data: UpdateProductInput) => {
        const payload: UpdateProductInput = {
            ...data,
            categoryId: selectedCategoryId,
            productType: selectedProductType,
            status: selectedStatus,
        };

        const result = await dispatch(
            updateProduct({
                id: product.id,
                organizationId: product.organizationId,
                data: payload,
            })
        );

        if (updateProduct.fulfilled.match(result)) {
            onOpenChange(false);
            onSuccess?.();
        }
    };

    const activeCategories = categoryList.filter((c) => c.status === "ACTIVE");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>Update the product details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Category & Status */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(v) => setSelectedStatus(v as ProductStatus)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Product name"
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Brand & Model */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" placeholder="Brand name" {...register("brand")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" placeholder="Model number" {...register("model")} />
                            </div>
                        </div>

                        {/* Product Type & UOM */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Product Type</Label>
                                <Select
                                    value={selectedProductType}
                                    onValueChange={(v) => setSelectedProductType(v as ProductType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productTypes.map((pt) => (
                                            <SelectItem key={pt.value} value={pt.value}>
                                                {pt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="uom">Unit of Measure</Label>
                                <Input id="uom" placeholder="pcs" {...register("uom")} />
                            </div>
                        </div>

                        {/* Cost & Reorder */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="unitCost">Unit Cost</Label>
                                <Input
                                    id="unitCost"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register("unitCost", { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reorderLevel">Reorder Level</Label>
                                <Input
                                    id="reorderLevel"
                                    type="number"
                                    placeholder="10"
                                    {...register("reorderLevel", { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Product description"
                                rows={2}
                                {...register("description")}
                            />
                        </div>

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
