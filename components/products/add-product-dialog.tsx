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
import { createProduct } from "@/store/slices/productSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { useAutoSelect } from "@/components/ui/auto-select";
import type { CreateProductInput, ProductType } from "@/lib/types";

interface AddProductDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
}

const productTypes: { value: ProductType; label: string }[] = [
    { value: "ASSET", label: "Asset" },
    { value: "CONSUMABLE", label: "Consumable" },
];

export function AddProductDialog({
    trigger,
    onSuccess,
    defaultOrgId,
}: AddProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedProductType, setSelectedProductType] = useState<ProductType>("ASSET");

    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.products);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { categories } = useAppSelector((state) => state.categories);

    // Ensure arrays are always arrays
    const orgList = Array.isArray(organizations) ? organizations : [];
    const categoryList = Array.isArray(categories) ? categories : [];

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
            dispatch(fetchCategories({ organizationId: selectedOrgId }));
            setSelectedCategoryId("");
        }
    }, [selectedOrgId, dispatch]);

    // Auto-select category if only one available
    const activeCategories = categoryList.filter((c) => c.status === "ACTIVE");
    const { shouldDisable: disableCategorySelect } = useAutoSelect(
        activeCategories,
        selectedCategoryId,
        setSelectedCategoryId
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
    } = useForm<Partial<CreateProductInput>>({
        defaultValues: {
            sku: "",
            name: "",
            brand: "",
            model: "",
            description: "",
            uom: "pcs",
            unitCost: 0,
            reorderLevel: 0,
        },
    });

    const onSubmit = async (data: Partial<CreateProductInput>) => {
        if (!selectedOrgId || !selectedCategoryId) return;

        const payload: CreateProductInput = {
            organizationId: selectedOrgId,
            sku: data.sku || "",
            name: data.name || "",
            categoryId: selectedCategoryId,
            brand: data.brand,
            model: data.model,
            description: data.description,
            productType: selectedProductType,
            isSerialized: selectedProductType === "ASSET",
            uom: data.uom,
            unitCost: data.unitCost,
            reorderLevel: data.reorderLevel,
        };

        const result = await dispatch(createProduct(payload));
        if (createProduct.fulfilled.match(result)) {
            reset();
            setSelectedCategoryId("");
            setSelectedProductType("ASSET");
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Product</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Product</DialogTitle>
                    <DialogDescription>
                        Create a new product for inventory management.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Organization & Category */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Organization *</Label>
                                <Select
                                    value={selectedOrgId}
                                    onValueChange={setSelectedOrgId}
                                    disabled={disableOrgSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
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
                                <Label>Category *</Label>
                                <Select
                                    value={selectedCategoryId}
                                    onValueChange={setSelectedCategoryId}
                                    disabled={!selectedOrgId || disableCategorySelect}
                                >
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
                        </div>

                        {/* SKU & Name */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU *</Label>
                                <Input
                                    id="sku"
                                    placeholder="SKU-001234"
                                    {...register("sku", { required: "SKU is required" })}
                                />
                                {errors.sku && (
                                    <p className="text-xs text-destructive">{errors.sku.message}</p>
                                )}
                            </div>
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
                                <Label>Product Type *</Label>
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
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedOrgId || !selectedCategoryId}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Product"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
