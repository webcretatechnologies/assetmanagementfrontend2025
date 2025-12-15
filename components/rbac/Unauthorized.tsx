"use client";

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UnauthorizedProps {
    title?: string;
    message?: string;
    showBackButton?: boolean;
}

export function Unauthorized({
    title = "Access Denied",
    message = "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
    showBackButton = true,
}: UnauthorizedProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="mb-6 p-4 rounded-full bg-destructive/10">
                <ShieldX className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground max-w-md mb-6">{message}</p>
            {showBackButton && (
                <Button asChild variant="outline">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            )}
        </div>
    );
}
