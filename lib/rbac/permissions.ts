import type { UserRole } from "@/lib/types";
import {
    LayoutDashboard,
    Building2,
    GitBranch,
    Users,
    Tags,
    Folder,
    Warehouse,
    ClipboardList,
    ClipboardCheck,
    User,
    Settings,
    Truck,
    Wrench,
    type LucideIcon,
} from "lucide-react";

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ORG_ADMIN: "ORG_ADMIN",
    BRANCH_MANAGER: "BRANCH_MANAGER",
    INVENTORY_OPERATOR: "INVENTORY_OPERATOR",
    SERVICE_TECHNICIAN: "SERVICE_TECHNICIAN",
    EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// =============================================================================
// MODULE DEFINITIONS
// =============================================================================

export const MODULES = {
    DASHBOARD: "DASHBOARD",
    ORGANIZATIONS: "ORGANIZATIONS",
    BRANCHES: "BRANCHES",
    USERS: "USERS",
    CATEGORIES: "CATEGORIES",
    PRODUCTS: "PRODUCTS", // Assets
    INVENTORY: "INVENTORY", // Stock Management
    ASSIGNMENTS: "ASSIGNMENTS", // Asset Assignments
    REQUESTS: "REQUESTS", // Service Requests
    VENDORS: "VENDORS", // Vendor Management
    SERVICE_LOGS: "SERVICE_LOGS", // Service Logs
    PROFILE: "PROFILE",
    REPORTS_ORG: "REPORTS_ORG",
    REPORTS_BRANCH: "REPORTS_BRANCH",
    SETTINGS: "SETTINGS",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// =============================================================================
// ACTION DEFINITIONS
// =============================================================================

export const ACTIONS = {
    VIEW: "VIEW",
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// =============================================================================
// PERMISSION TYPES
// =============================================================================

export type PermissionLevel = "FULL" | "VIEW_ONLY" | "OWN_BRANCH" | "OWN_ORG" | "OWN" | "NONE";

export interface ModulePermission {
    level: PermissionLevel;
    actions: Action[];
}

// =============================================================================
// PERMISSION MATRIX
// Based on the requirement specification
// =============================================================================

export const PERMISSION_MATRIX: Record<Role, Record<Module, ModulePermission>> = {
    [ROLES.SUPER_ADMIN]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.ORGANIZATIONS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.BRANCHES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.USERS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.CATEGORIES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PRODUCTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.INVENTORY]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.ASSIGNMENTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.REQUESTS]: { level: "OWN", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.VENDORS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.SERVICE_LOGS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.REPORTS_BRANCH]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.SETTINGS]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
    },
    [ROLES.ORG_ADMIN]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.ORGANIZATIONS]: { level: "NONE", actions: [] },
        [MODULES.BRANCHES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.USERS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.CATEGORIES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PRODUCTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.INVENTORY]: { level: "OWN_ORG", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.ASSIGNMENTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.REQUESTS]: { level: "OWN", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.VENDORS]: { level: "OWN_ORG", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.SERVICE_LOGS]: { level: "OWN_ORG", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.REPORTS_BRANCH]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.SETTINGS]: { level: "OWN_ORG", actions: ["VIEW", "UPDATE"] },
    },
    [ROLES.BRANCH_MANAGER]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.ORGANIZATIONS]: { level: "NONE", actions: [] },
        [MODULES.BRANCHES]: { level: "OWN_BRANCH", actions: ["VIEW", "UPDATE"] },
        [MODULES.USERS]: { level: "OWN_BRANCH", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.CATEGORIES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PRODUCTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.INVENTORY]: { level: "OWN_BRANCH", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.ASSIGNMENTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.REQUESTS]: { level: "OWN", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.VENDORS]: { level: "OWN_ORG", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.SERVICE_LOGS]: { level: "OWN_BRANCH", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "NONE", actions: [] },
        [MODULES.REPORTS_BRANCH]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.SETTINGS]: { level: "OWN", actions: ["VIEW", "UPDATE"] },
    },
    [ROLES.INVENTORY_OPERATOR]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.ORGANIZATIONS]: { level: "NONE", actions: [] },
        [MODULES.BRANCHES]: { level: "NONE", actions: [] },
        [MODULES.USERS]: { level: "NONE", actions: [] },
        [MODULES.CATEGORIES]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.PRODUCTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.INVENTORY]: { level: "OWN_BRANCH", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.ASSIGNMENTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.REQUESTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.VENDORS]: { level: "OWN_ORG", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.SERVICE_LOGS]: { level: "OWN_BRANCH", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "NONE", actions: [] },
        [MODULES.REPORTS_BRANCH]: { level: "VIEW_ONLY", actions: ["VIEW"] },
        [MODULES.SETTINGS]: { level: "OWN", actions: ["VIEW", "UPDATE"] },
    },
    [ROLES.SERVICE_TECHNICIAN]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.ORGANIZATIONS]: { level: "NONE", actions: [] },
        [MODULES.BRANCHES]: { level: "NONE", actions: [] },
        [MODULES.USERS]: { level: "NONE", actions: [] },
        [MODULES.CATEGORIES]: { level: "NONE", actions: [] },
        [MODULES.PRODUCTS]: { level: "VIEW_ONLY", actions: ["VIEW"] },
        [MODULES.INVENTORY]: { level: "NONE", actions: [] },
        [MODULES.ASSIGNMENTS]: { level: "NONE", actions: [] },
        [MODULES.REQUESTS]: { level: "FULL", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
        [MODULES.VENDORS]: { level: "VIEW_ONLY", actions: ["VIEW"] },
        [MODULES.SERVICE_LOGS]: { level: "OWN", actions: ["VIEW", "CREATE", "UPDATE"] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "NONE", actions: [] },
        [MODULES.REPORTS_BRANCH]: { level: "VIEW_ONLY", actions: ["VIEW"] },
        [MODULES.SETTINGS]: { level: "OWN", actions: ["VIEW", "UPDATE"] },
    },
    [ROLES.EMPLOYEE]: {
        [MODULES.DASHBOARD]: { level: "FULL", actions: ["VIEW"] },
        [MODULES.ORGANIZATIONS]: { level: "NONE", actions: [] },
        [MODULES.BRANCHES]: { level: "NONE", actions: [] },
        [MODULES.USERS]: { level: "NONE", actions: [] },
        [MODULES.CATEGORIES]: { level: "NONE", actions: [] },
        [MODULES.PRODUCTS]: { level: "NONE", actions: [] },
        [MODULES.INVENTORY]: { level: "NONE", actions: [] },
        [MODULES.ASSIGNMENTS]: { level: "VIEW_ONLY", actions: ["VIEW"] }, // Can view own assignments
        [MODULES.REQUESTS]: { level: "OWN", actions: ["VIEW", "CREATE"] }, // Can only create and view own requests
        [MODULES.VENDORS]: { level: "NONE", actions: [] },
        [MODULES.SERVICE_LOGS]: { level: "NONE", actions: [] },
        [MODULES.PROFILE]: { level: "FULL", actions: ["VIEW", "UPDATE"] },
        [MODULES.REPORTS_ORG]: { level: "NONE", actions: [] },
        [MODULES.REPORTS_BRANCH]: { level: "NONE", actions: [] },
        [MODULES.SETTINGS]: { level: "OWN", actions: ["VIEW", "UPDATE"] },
    },
};

// =============================================================================
// NAVIGATION ITEMS WITH MODULE MAPPING
// =============================================================================

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    module: Module;
}

export const NAV_ITEMS: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        module: MODULES.DASHBOARD,
    },
    {
        title: "Organizations",
        href: "/organizations",
        icon: Building2,
        module: MODULES.ORGANIZATIONS,
    },
    {
        title: "Branches",
        href: "/branches",
        icon: GitBranch,
        module: MODULES.BRANCHES,
    },
    {
        title: "Users",
        href: "/users",
        icon: Users,
        module: MODULES.USERS,
    },
    {
        title: "Categories",
        href: "/categories",
        icon: Tags,
        module: MODULES.CATEGORIES,
    },
    {
        title: "Assets",
        href: "/assets",
        icon: Folder,
        module: MODULES.PRODUCTS,
    },
    {
        title: "Inventory",
        href: "/inventory",
        icon: Warehouse,
        module: MODULES.INVENTORY,
    },
    {
        title: "Assignments",
        href: "/assignments",
        icon: ClipboardList,
        module: MODULES.ASSIGNMENTS,
    },
    {
        title: "Requests",
        href: "/requests",
        icon: ClipboardCheck,
        module: MODULES.REQUESTS,
    },
    {
        title: "Vendors",
        href: "/vendors",
        icon: Truck,
        module: MODULES.VENDORS,
    },
    {
        title: "Service Logs",
        href: "/service-logs",
        icon: Wrench,
        module: MODULES.SERVICE_LOGS,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        module: MODULES.SETTINGS,
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User,
        module: MODULES.PROFILE,
    },
];

// =============================================================================
// ROLE DISPLAY NAMES
// =============================================================================

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
    [ROLES.SUPER_ADMIN]: "Super Admin",
    [ROLES.ORG_ADMIN]: "Organization Admin",
    [ROLES.BRANCH_MANAGER]: "Branch Manager",
    [ROLES.INVENTORY_OPERATOR]: "Inventory Operator",
    [ROLES.SERVICE_TECHNICIAN]: "Service Technician",
    [ROLES.EMPLOYEE]: "Employee",
};

// Type guard to check if a string is a valid Role
export function isValidRole(role: string | undefined): role is Role {
    return role !== undefined && Object.values(ROLES).includes(role as Role);
}
