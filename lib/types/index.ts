// Pagination Types
export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Organization Types
export interface Organization {
    id: string;
    name: string;
    industryType: string;
    ownerEmail: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrganizationInput {
    name: string;
    industryType: string;
    ownerEmail: string;
}

export interface UpdateOrganizationInput {
    name?: string;
    industryType?: string;
    ownerEmail?: string;
    status?: "ACTIVE" | "INACTIVE";
}

// Branch Types
export interface Branch {
    id: string;
    orgId: string;
    name: string;
    address: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
    organization?: Organization;
}

export interface CreateBranchInput {
    orgId: string;
    name: string;
    address: string;
}

export interface UpdateBranchInput {
    name?: string;
    address?: string;
}

// User Types
export type UserRole =
    | "SUPER_ADMIN"
    | "ORG_ADMIN"
    | "BRANCH_MANAGER"
    | "INVENTORY_OPERATOR"
    | "SERVICE_TECHNICIAN"
    | "EMPLOYEE";

export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export interface User {
    id: string;
    orgId: string;
    branchId?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
    organization?: Organization;
    branch?: Branch;
}

export interface CreateUserInput {
    orgId: string;
    branchId?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    branchId?: string;
    role?: UserRole;
    status?: UserStatus;
}

// Category Types
export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    status: CategoryStatus;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface CreateCategoryInput {
    organizationId: string;
    name: string;
    description?: string;
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string;
    status?: CategoryStatus;
}

// Product Types
export type ProductType = "CONSUMABLE" | "ASSET";
export type ServiceFrequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface Product {
    id: string;
    organizationId: string;
    sku: string;
    name: string;
    categoryId: string;
    brand?: string;
    model?: string;
    description?: string;
    productType: ProductType;
    isSerialized: boolean;
    uom?: string;
    unitCost?: string | number;
    reorderLevel?: number;
    status: ProductStatus;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    category?: {
        id: string;
        name: string;
    };
}

export interface CreateProductInput {
    organizationId: string;
    sku: string;
    name: string;
    categoryId: string;
    brand?: string;
    model?: string;
    description?: string;
    productType: ProductType;
    isSerialized?: boolean;
    uom?: string;
    unitCost?: number;
    reorderLevel?: number;
}

export interface UpdateProductInput {
    name?: string;
    categoryId?: string;
    brand?: string;
    model?: string;
    description?: string;
    productType?: ProductType;
    isSerialized?: boolean;
    uom?: string;
    unitCost?: number;
    reorderLevel?: number;
    status?: ProductStatus;
}

export interface ProductsResponse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Asset Assignment Types
export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETURNED" | "DISPOSED";
export type AssignmentStatus = "ACTIVE" | "RETURNED" | "PENDING_RETURN" | "IN_REPAIR";
export type AssetCondition = "Excellent" | "Good" | "Fair" | "Poor";

export interface AssetAssignment {
    id: string;
    productId: string;
    userId: string;
    organizationId: string;
    branchId: string;
    serialNumber?: string;
    assignmentDate: string;
    returnDate?: string | null;
    status: AssignmentStatus;
    conditionOnIssue?: string;
    conditionOnReturn?: string | null;
    purpose?: string;
    assignedBy?: string;
    returnedBy?: string | null;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    product?: {
        id: string;
        name: string;
        sku: string;
        currentStatus?: AssetStatus;
        category?: {
            id: string;
            name: string;
        };
    };
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role?: UserRole;
        branchId?: string;
    };
    branch?: {
        id: string;
        name: string;
    };
    assignedByUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    returnedByUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
}

export interface CreateAssignmentInput {
    productId: string;
    userId: string;
    organizationId: string;
    branchId: string;
    serialNumber?: string;
    conditionOnIssue?: string;
    purpose?: string;
    notes?: string;
}

export interface AssignmentsResponse {
    data: AssetAssignment[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AvailableAsset {
    id: string;  // Inventory item ID
    organizationId: string;
    branchId: string;
    productId: string;
    serialNumber?: string;
    barcode?: string;
    status: string;
    quantity: number;
    assignedToUserId?: string;
    purchaseDate?: string;
    createdAt: string;
    updatedAt: string;
    product: {
        id: string;
        sku: string;
        name: string;
        brand?: string;
        model?: string;
        productType: ProductType;
        isSerialized: boolean;
        unitCost?: string;
        category?: {
            id: string;
            name: string;
        };
    };
    branch?: {
        id: string;
        name: string;
    };
}

// Asset Request Types
export type RequestType = "RETURN" | "REPAIR";
export type RequestStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
export type RequestUrgency = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface AssetRequest {
    id: string;
    assignmentId: string;
    userId: string;
    organizationId: string;
    branchId: string;
    requestType: RequestType;
    reason: string;
    description?: string;
    urgency: RequestUrgency;
    attachments?: string;
    status: RequestStatus;
    assignedTo?: string | null;
    requestedAt: string;
    claimedAt?: string | null;
    reviewedAt?: string | null;
    completedAt?: string | null;
    resolutionNotes?: string | null;
    rejectionReason?: string | null;
    estimatedCompletionDate?: string | null;
    createdAt: string;
    updatedAt: string;
    assignment?: {
        id: string;
        status: AssignmentStatus;
        serialNumber?: string;
        product?: {
            id: string;
            name: string;
            sku: string;
            currentStatus?: AssetStatus;
            category?: {
                id?: string;
                name: string;
            };
        };
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            branchId?: string;
        };
        branch?: {
            id: string;
            name: string;
        };
    };
    requester?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    assignedToUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
}

export interface CreateRequestInput {
    assignmentId: string;
    requestType: RequestType;
    reason: string;
    description?: string;
    urgency?: RequestUrgency;
    attachments?: string;
}

export interface RequestsResponse {
    data: AssetRequest[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Auth Types
export interface AuthUser {
    id: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    access_token: string;
    user: AuthUser;
}

// Inventory Types
export type InventoryStatus = "AVAILABLE" | "ASSIGNED" | "IN_TRANSIT" | "DAMAGED" | "DISPOSED" | "WRITTEN_OFF";

export interface InventoryItem {
    id: string;
    organizationId: string;
    branchId: string;
    productId: string;
    product?: Product;
    branch?: Branch;
    serialNumber?: string;
    barcode?: string;
    quantity: number;
    status: InventoryStatus;
    purchaseDate?: string;
    vendorId?: string;
    vendor?: Vendor;
    // Service fields
    requiresService?: boolean;
    serviceFrequency?: ServiceFrequency;
    serviceInstructions?: string;
    // Warranty fields
    hasWarranty?: boolean;
    warrantyProvider?: string;
    warrantyDurationMonths?: number;
    warrantyExpiryDate?: string;
    // Guarantee fields
    hasGuarantee?: boolean;
    guaranteeDurationMonths?: number;
    guaranteeExpiryDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AddInventoryInput {
    organizationId: string;
    branchId: string;
    productId: string;
    quantity: number;
    serialNumbers?: string[];
    purchaseDate?: string;
    // Service fields
    requiresService?: boolean;
    serviceFrequency?: ServiceFrequency;
    serviceInstructions?: string;
    // Warranty fields
    hasWarranty?: boolean;
    warrantyProvider?: string;
    warrantyDurationMonths?: number;
    warrantyExpiryDate?: string;
    // Guarantee fields
    hasGuarantee?: boolean;
    guaranteeDurationMonths?: number;
    guaranteeExpiryDate?: string;
    // Invoice fields
    hasInvoice?: boolean;
    invoiceNumber?: string;
    invoiceDate?: string;
    vendorId?: string;
    vendorName?: string;
    currency?: string;
}

export interface UpdateInventoryInput {
    serialNumber?: string;
    barcode?: string;
    purchaseDate?: string;
    vendorId?: string;
    requiresService?: boolean;
    serviceFrequency?: ServiceFrequency;
    serviceInstructions?: string;
    hasWarranty?: boolean;
    warrantyProvider?: string;
    warrantyExpiryDate?: string;
    hasGuarantee?: boolean;
    guaranteeExpiryDate?: string;
}

export interface TransferInventoryInput {
    organizationId: string;
    inventoryItemId: string;
    toBranchId: string;
}

export interface GetInventoryParams {
    organizationId: string;
    branchId?: string;
    search?: string;
    status?: InventoryStatus;
    page?: number;
    limit?: number;
}

export interface InventoryResponse {
    data: InventoryItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface TransferResult {
    success: boolean;
    transferred: number;
}

// Settings Types

// Public config (no auth required) - for login screen, etc.
export interface PublicConfig {
    language: string;
    timezone: string;
    maintenanceMode: boolean;
}

// User profile settings (any authenticated user)
export interface UserSettings {
    language: string;
    timezone: string;
}

export interface UpdateUserSettingsInput {
    language?: string;
    timezone?: string;
}

// Global system settings (SUPER_ADMIN only)
export interface GlobalSettings {
    id: string;
    userId?: string | null;
    language: string;
    timezone: string;
    maintenanceMode: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    emailTemplates?: Record<string, string>;
    smsTemplates?: Record<string, string>;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateGlobalSettingsInput {
    language?: string;
    timezone?: string;
    maintenanceMode?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    emailTemplates?: Record<string, string>;
    smsTemplates?: Record<string, string>;
}

// Organization SMTP settings
export interface OrgSmtpSettings {
    id?: string;
    organizationId: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpSecure?: boolean;
    smtpFromEmail?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateOrgSmtpSettingsInput {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    smtpFromEmail?: string;
}

// Inventory Import/Export Types
export interface ImportInventoryResult {
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; error: string; sku: string }>;
}

export interface ExportInventoryParams {
    organizationId: string;
    branchId?: string;
    status?: InventoryStatus;
    search?: string;
}

export type ImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERTED";

export interface ImportRecord {
    id: string;
    filename: string;
    status: ImportStatus;
    createdAt: string;
    transactions: number;
}

export interface UndoImportResult {
    message: string;
}

// =============================================================================
// VENDOR TYPES
// =============================================================================

export type VendorType = "SUPPLIER" | "SERVICE_PROVIDER";
export type VendorStatus = "ACTIVE" | "INACTIVE";
export type VendorCategory =
    | "IT_HARDWARE"
    | "HVAC"
    | "ELECTRICAL"
    | "PLUMBING"
    | "OFFICE_SUPPLIES"
    | "FURNITURE"
    | "SECURITY"
    | "ELECTRONICS"
    | "MACHINERY"
    | "VEHICLES"
    | "CLEANING"
    | "GENERAL_MAINTENANCE"
    | "OTHER";

export type PaymentTerms =
    | "IMMEDIATE"
    | "NET_7"
    | "NET_15"
    | "NET_30"
    | "NET_45"
    | "NET_60"
    | "ADVANCE"
    | "CUSTOM";

export interface Vendor {
    id: string;
    organizationId: string;
    name: string;
    vendorType: VendorType;
    category: VendorCategory;
    code?: string;
    contactPerson: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstNumber?: string;
    panNumber?: string;
    registrationNumber?: string;
    paymentTerms?: PaymentTerms;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankBranch?: string;
    status: VendorStatus;
    notes?: string;
    rating?: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    organization?: Organization;
}

export interface CreateVendorInput {
    organizationId?: string;
    name: string;
    vendorType: VendorType;
    category: VendorCategory;
    contactPerson: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstNumber?: string;
    panNumber?: string;
    registrationNumber?: string;
    paymentTerms?: PaymentTerms;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankBranch?: string;
    notes?: string;
}

export interface UpdateVendorInput {
    name?: string;
    category?: VendorCategory;
    contactPerson?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstNumber?: string;
    panNumber?: string;
    registrationNumber?: string;
    paymentTerms?: PaymentTerms;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankBranch?: string;
    notes?: string;
    rating?: number;
    status?: VendorStatus;
}

export interface GetVendorsParams {
    organizationId?: string;
    search?: string;
    type?: VendorType;
    category?: VendorCategory;
    status?: VendorStatus;
    page?: number;
    limit?: number;
}

export interface VendorsResponse {
    data: Vendor[];
    meta: PaginatedMeta;
}

export interface VendorStats {
    totalSuppliedItems: number;
    totalServices: number;
    totalServiceCost: number;
    totalInventoryCostEst: number;
}

// =============================================================================
// SERVICE LOG TYPES
// =============================================================================

export type ServiceLogStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ServiceLog {
    id: string;
    organizationId: string;
    branchId: string;
    vendorId: string;
    inventoryItemId?: string;
    requestId?: string;
    serviceType: string;
    title: string;
    description?: string;
    performedBy: string;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    laborCost?: number;
    partsCost?: number;
    totalCost?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    attachments?: string[];
    status: ServiceLogStatus;
    notes?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    vendor?: Vendor;
    inventoryItem?: InventoryItem;
    request?: AssetRequest;
    branch?: Branch;
}

export interface CreateServiceLogInput {
    organizationId?: string;
    branchId: string;
    vendorId: string;
    inventoryItemId?: string;
    requestId?: string;
    serviceType: string;
    title: string;
    description?: string;
    performedBy: string;
    scheduledDate?: string;
    laborCost?: number;
    partsCost?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    status?: ServiceLogStatus;
    completedAt?: string;
}

export interface UpdateServiceLogInput {
    serviceType?: string;
    title?: string;
    description?: string;
    performedBy?: string;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    laborCost?: number;
    partsCost?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    status?: ServiceLogStatus;
}

export interface GetServiceLogsParams {
    organizationId?: string;
    branchId?: string;
    vendorId?: string;
    inventoryItemId?: string;
    status?: ServiceLogStatus;
    page?: number;
    limit?: number;
}

export interface ServiceLogsResponse {
    data: ServiceLog[];
    meta: PaginatedMeta;
}
