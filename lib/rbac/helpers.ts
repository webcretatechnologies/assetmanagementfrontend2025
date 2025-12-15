import {
    PERMISSION_MATRIX,
    NAV_ITEMS,
    ROLES,
    MODULES,
    type Role,
    type Module,
    type Action,
    type NavItem,
    isValidRole,
} from "./permissions";

// =============================================================================
// PERMISSION CHECK HELPERS
// =============================================================================

/**
 * Check if a role has permission to perform a specific action on a module
 */
export function hasPermission(
    role: string | undefined,
    module: Module,
    action: Action
): boolean {
    if (!role || !isValidRole(role)) return false;

    const modulePermissions = PERMISSION_MATRIX[role]?.[module];
    if (!modulePermissions) return false;

    return modulePermissions.actions.includes(action);
}

/**
 * Check if a role can access a module at all (has VIEW permission)
 */
export function canAccessModule(role: string | undefined, module: Module): boolean {
    return hasPermission(role, module, "VIEW");
}

/**
 * Get the permission level for a role on a specific module
 */
export function getPermissionLevel(role: string | undefined, module: Module) {
    if (!role || !isValidRole(role)) return "NONE";
    return PERMISSION_MATRIX[role]?.[module]?.level ?? "NONE";
}

/**
 * Check if user has VIEW_ONLY access (cannot modify)
 */
export function isViewOnly(role: string | undefined, module: Module): boolean {
    return getPermissionLevel(role, module) === "VIEW_ONLY";
}

/**
 * Check if user has scope limited to their own branch
 */
export function isOwnBranchOnly(role: string | undefined, module: Module): boolean {
    return getPermissionLevel(role, module) === "OWN_BRANCH";
}

/**
 * Check if user has scope limited to their own organization
 */
export function isOwnOrgOnly(role: string | undefined, module: Module): boolean {
    return getPermissionLevel(role, module) === "OWN_ORG";
}

// =============================================================================
// ROLE CHECK HELPERS
// =============================================================================

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(role: string | undefined): boolean {
    return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if user is Organization Admin
 */
export function isOrgAdmin(role: string | undefined): boolean {
    return role === ROLES.ORG_ADMIN;
}

/**
 * Check if user is Branch Manager
 */
export function isBranchManager(role: string | undefined): boolean {
    return role === ROLES.BRANCH_MANAGER;
}

/**
 * Check if user is Inventory Operator
 */
export function isInventoryOperator(role: string | undefined): boolean {
    return role === ROLES.INVENTORY_OPERATOR;
}

/**
 * Check if user is Service Technician
 */
export function isServiceTechnician(role: string | undefined): boolean {
    return role === ROLES.SERVICE_TECHNICIAN;
}

/**
 * Check if user is Employee
 */
export function isEmployee(role: string | undefined): boolean {
    return role === ROLES.EMPLOYEE;
}

/**
 * Check if user can view ALL requests (not just their own)
 * Only INVENTORY_OPERATOR and SERVICE_TECHNICIAN can see all requests
 * EMPLOYEE, managers, and admins can only see their own requests
 */
export function canViewAllRequests(role: string | undefined): boolean {
    return isInventoryOperator(role) || isServiceTechnician(role);
}

/**
 * Check if user has admin-level access (Super Admin or Org Admin)
 */
export function isAdmin(role: string | undefined): boolean {
    return isSuperAdmin(role) || isOrgAdmin(role);
}

/**
 * Check if user has manager-level access or higher
 */
export function isManagerOrAbove(role: string | undefined): boolean {
    return isAdmin(role) || isBranchManager(role);
}

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

/**
 * Get navigation items accessible by a specific role
 */
export function getAccessibleNavItems(role: string | undefined): NavItem[] {
    if (!role || !isValidRole(role)) return [];

    return NAV_ITEMS.filter((item) => canAccessModule(role, item.module));
}

// =============================================================================
// DATA FILTERING HELPERS
// =============================================================================

/**
 * Determine if user should see only their branch data
 */
export function shouldFilterByBranch(
    role: string | undefined,
    module: Module
): boolean {
    if (!role || !isValidRole(role)) return true;

    const level = getPermissionLevel(role, module);
    return level === "OWN_BRANCH";
}

/**
 * Determine if user should see only their organization data
 * (applies to most users except super admin when viewing across orgs)
 */
export function shouldFilterByOrg(role: string | undefined): boolean {
    // Only super admin can potentially see across organizations
    return !isSuperAdmin(role);
}

// =============================================================================
// BUTTON/ACTION VISIBILITY HELPERS
// =============================================================================

/**
 * Check if user can create items in a module
 */
export function canCreate(role: string | undefined, module: Module): boolean {
    return hasPermission(role, module, "CREATE");
}

/**
 * Check if user can update items in a module
 */
export function canUpdate(role: string | undefined, module: Module): boolean {
    return hasPermission(role, module, "UPDATE");
}

/**
 * Check if user can delete items in a module
 */
export function canDelete(role: string | undefined, module: Module): boolean {
    return hasPermission(role, module, "DELETE");
}

/**
 * Get all allowed actions for a role on a module
 */
export function getAllowedActions(
    role: string | undefined,
    module: Module
): Action[] {
    if (!role || !isValidRole(role)) return [];
    return PERMISSION_MATRIX[role]?.[module]?.actions ?? [];
}

// =============================================================================
// ROLE ASSIGNMENT HELPERS
// =============================================================================

/**
 * Role hierarchy for assignment permissions (lower index = higher privilege)
 */
const ROLE_HIERARCHY: Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.INVENTORY_OPERATOR,
    ROLES.SERVICE_TECHNICIAN,
    ROLES.EMPLOYEE,
];

/**
 * Get the list of roles that a user can assign based on their current role.
 * Users can only assign roles below their level in the hierarchy.
 */
export function getAssignableRoles(currentUserRole: string | undefined): Role[] {
    if (!currentUserRole || !isValidRole(currentUserRole)) return [];

    const currentRoleIndex = ROLE_HIERARCHY.indexOf(currentUserRole as Role);

    // If role not found in hierarchy or is lowest level, can't assign any role
    if (currentRoleIndex === -1 || currentRoleIndex >= ROLE_HIERARCHY.length - 1) {
        return [];
    }

    // SUPER_ADMIN can assign all roles
    if (isSuperAdmin(currentUserRole)) {
        return [...ROLE_HIERARCHY];
    }

    // ORG_ADMIN can assign all roles except SUPER_ADMIN
    if (isOrgAdmin(currentUserRole)) {
        return ROLE_HIERARCHY.filter(role => role !== ROLES.SUPER_ADMIN);
    }

    // BRANCH_MANAGER can assign INVENTORY_OPERATOR, SERVICE_TECHNICIAN, and EMPLOYEE
    if (isBranchManager(currentUserRole)) {
        return [ROLES.INVENTORY_OPERATOR, ROLES.SERVICE_TECHNICIAN, ROLES.EMPLOYEE];
    }

    // INVENTORY_OPERATOR, SERVICE_TECHNICIAN, and EMPLOYEE cannot assign roles
    return [];
}

/**
 * Check if a user can assign a specific role
 */
export function canAssignRole(currentUserRole: string | undefined, targetRole: Role): boolean {
    const assignableRoles = getAssignableRoles(currentUserRole);
    return assignableRoles.includes(targetRole);
}

// =============================================================================
// INVENTORY TRANSFER HELPERS
// =============================================================================

/**
 * Check if user can transfer inventory
 * Only Org Admin, Branch Manager, and Inventory Operator can transfer
 * Note: Super Admin cannot transfer inventory
 */
export function canTransferInventory(role: string | undefined): boolean {
    return isOrgAdmin(role) ||
        isBranchManager(role) ||
        isInventoryOperator(role);
}

/**
 * Check if user can select source branch for transfer
 * Only Super Admin and Org Admin can select any source branch
 * Branch Manager and Inventory Operator must use their assigned branch
 */
export function canSelectSourceBranch(role: string | undefined): boolean {
    return isSuperAdmin(role) || isOrgAdmin(role);
}
