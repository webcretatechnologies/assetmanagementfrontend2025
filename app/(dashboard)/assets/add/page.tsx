"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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

export default function AddAssetPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
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
        // Simulate API call
        console.log("Asset data:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
        router.push("/assets");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                        Add New Asset
                    </h1>
                    <p className="text-muted-foreground">
                        Register a new asset to your inventory
                    </p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Asset Details</CardTitle>
                    <CardDescription>
                        Fill in the information below to add a new asset
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Asset Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., MacBook Pro 16-inch"
                                    {...register("name", { required: "Asset name is required" })}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Input
                                    id="category"
                                    placeholder="e.g., Electronics, Furniture"
                                    {...register("category", { required: "Category is required" })}
                                />
                                {errors.category && (
                                    <p className="text-xs text-destructive">
                                        {errors.category.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="serialNumber">Serial Number</Label>
                                <Input
                                    id="serialNumber"
                                    placeholder="e.g., ABC123XYZ"
                                    {...register("serialNumber")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchaseDate">Purchase Date</Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    {...register("purchaseDate")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Purchase Price</Label>
                                <Input
                                    id="purchasePrice"
                                    placeholder="e.g., 2499.00"
                                    {...register("purchasePrice")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Office A, Storage Room"
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
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                placeholder="Additional details about the asset..."
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register("description")}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
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
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
