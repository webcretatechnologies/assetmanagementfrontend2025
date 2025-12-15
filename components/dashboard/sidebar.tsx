"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { getAccessibleNavItems, type NavItem } from "@/lib/rbac";

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAppSelector((state) => state.auth);
    const [mounted, setMounted] = useState(false);
    const [navItems, setNavItems] = useState<NavItem[]>([]);

    // Delay navigation items rendering until client-side to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && user?.role) {
            setNavItems(getAccessibleNavItems(user.role));
        }
    }, [mounted, user?.role]);

    return (
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
            {/* Logo */}
            <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Inventory
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1">
                {mounted && navItems
                    .filter(item => item.href !== "/settings") // Settings shown separately at bottom
                    .map((item) => {
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
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </Button>
                        );
                    })}
            </nav>

            {/* Settings - shown at bottom for eligible users */}
            {mounted && navItems.some(item => item.href === "/settings") && (
                <div className="p-4 border-t border-border">
                    <Button
                        variant={pathname === "/settings" ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-4",
                            pathname === "/settings" && "bg-primary/10 text-primary hover:bg-primary/15"
                        )}
                        asChild
                    >
                        <Link href="/settings">
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                        </Link>
                    </Button>
                </div>
            )}
        </aside>
    );
}
