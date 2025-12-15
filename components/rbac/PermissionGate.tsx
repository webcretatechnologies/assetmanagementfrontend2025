"use client";

import { useAppSelector } from "@/store/hooks";
import { hasPermission, canAccessModule } from "@/lib/rbac";
import type { Module, Action } from "@/lib/rbac";

interface PermissionGateProps {
    children: React.ReactNode;
    module: Module;
    action?: Action;
    fallback?: React.ReactNode;
}

/**
 * PermissionGate - Conditionally render children based on user permissions
 * 
 * @example
 * // Hide button if user can't create organizations
 * <PermissionGate module="ORGANIZATIONS" action="CREATE">
 *   <AddOrganizationButton />
 * </PermissionGate>
 * 
 * @example
 * // Show alternative content if user can't access
 * <PermissionGate module="USERS" action="VIEW" fallback={<span>No access</span>}>
 *   <UsersList />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    module,
    action,
    fallback = null,
}: PermissionGateProps) {
    const { user } = useAppSelector((state) => state.auth);
    const userRole = user?.role;

    // If action is specified, check for that specific permission
    // Otherwise, just check if user can access the module at all
    const hasAccess = action
        ? hasPermission(userRole, module, action)
        : canAccessModule(userRole, module);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
