"use client";

import { MobileSidebar } from "./mobile-sidebar";
import { UserNav } from "./user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Package } from "lucide-react";

export function Header() {
    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                {/* Mobile Logo */}
                <div className="flex lg:hidden items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold">Inventory</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserNav />
            </div>
        </header>
    );
}

