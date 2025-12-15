"use client";

import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    MapPin,
    Tag,
    DollarSign,
    Hash,
    Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Sample data - would typically come from an API
const assetData: Record<string, {
    id: string;
    name: string;
    category: string;
    status: string;
    location: string;
    value: string;
    serialNumber: string;
    purchaseDate: string;
    description: string;
    lastUpdated: string;
}> = {
    AST001: {
        id: "AST001",
        name: "MacBook Pro 16-inch",
        category: "Electronics",
        status: "Active",
        location: "Office A",
        value: "$2,499",
        serialNumber: "C02XL0GTJGH7",
        purchaseDate: "2024-01-15",
        description:
            "Apple MacBook Pro 16-inch with M3 Pro chip, 18GB RAM, 512GB SSD. Used for development purposes.",
        lastUpdated: "2024-01-15",
    },
    AST002: {
        id: "AST002",
        name: "Herman Miller Chair",
        category: "Furniture",
        status: "Active",
        location: "Office B",
        value: "$1,295",
        serialNumber: "HM-2024-00123",
        purchaseDate: "2024-01-10",
        description:
            "Herman Miller Aeron Chair, Size C, Graphite frame with adjustable arms.",
        lastUpdated: "2024-01-14",
    },
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "active":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "maintenance":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "assigned":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

export default function AssetDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const assetId = params.id as string;

    // Get asset data (would typically be fetched from API)
    const asset = assetData[assetId] || {
        id: assetId,
        name: "Unknown Asset",
        category: "Unknown",
        status: "Unknown",
        location: "Unknown",
        value: "$0",
        serialNumber: "N/A",
        purchaseDate: "N/A",
        description: "Asset details not found.",
        lastUpdated: "N/A",
    };

    const detailItems = [
        { label: "Asset ID", value: asset.id, icon: Hash },
        { label: "Category", value: asset.category, icon: Tag },
        { label: "Location", value: asset.location, icon: MapPin },
        { label: "Value", value: asset.value, icon: DollarSign },
        { label: "Serial Number", value: asset.serialNumber, icon: Package },
        { label: "Purchase Date", value: asset.purchaseDate, icon: Calendar },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            {asset.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground">{asset.id}</span>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                    asset.status
                                )}`}
                            >
                                {asset.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 ml-11 sm:ml-0">
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Asset Details</CardTitle>
                        <CardDescription>
                            Complete information about this asset
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {detailItems.map((item) => (
                                <div key={item.label} className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="font-medium">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity</CardTitle>
                        <CardDescription>Recent changes to this asset</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                <div>
                                    <p className="text-sm font-medium">Asset created</p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.purchaseDate}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
                                <div>
                                    <p className="text-sm font-medium">Last updated</p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.lastUpdated}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{asset.description}</p>
                </CardContent>
            </Card>
        </div>
    );
}
