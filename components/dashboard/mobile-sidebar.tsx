"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Package, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { getAccessibleNavItems } from "@/lib/rbac";

export function MobileSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { user } = useAppSelector((state) => state.auth);

    // Get navigation items accessible by user's role
    const navItems = getAccessibleNavItems(user?.role);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="h-16 flex flex-row items-center gap-2 px-6 border-b border-border">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <SheetTitle className="text-lg font-semibold">Inventory</SheetTitle>
                </SheetHeader>

                <nav className="flex-1 py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <Button
                                key={item.href}
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-11 px-4",
                                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                                )}
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </Button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 px-4"
                    >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
