"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { canAccessModule } from "@/lib/rbac";
import { Unauthorized } from "./Unauthorized";
import type { Module } from "@/lib/rbac";

interface ProtectedPageProps {
    children: React.ReactNode;
    module: Module;
    unauthorizedTitle?: string;
    unauthorizedMessage?: string;
}

/**
 * ProtectedPage - Wrap page content to show Unauthorized if user lacks access
 * 
 * @example
 * <ProtectedPage module="ORGANIZATIONS">
 *   <OrganizationsPageContent />
 * </ProtectedPage>
 */
export function ProtectedPage({
    children,
    module,
    unauthorizedTitle,
    unauthorizedMessage,
}: ProtectedPageProps) {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const userRole = user?.role;
    const [mounted, setMounted] = useState(false);

    // Wait for client-side mount to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR and initial client render, show nothing to prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    // If not authenticated, don't show anything (middleware will redirect)
    if (!isAuthenticated || !user) {
        return null;
    }

    // Check if user can access this module
    if (!canAccessModule(userRole, module)) {
        return (
            <Unauthorized
                title={unauthorizedTitle}
                message={unauthorizedMessage}
            />
        );
    }

    return <>{children}</>;
}
