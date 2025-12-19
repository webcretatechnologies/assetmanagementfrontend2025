"use client";

import { apiClient } from "./client";
import type {
    InventoryItem,
    InventoryResponse,
    AddInventoryInput,
    UpdateInventoryInput,
    TransferInventoryInput,
    GetInventoryParams,
    TransferResult,
    ImportInventoryResult,
    ExportInventoryParams,
    ImportRecord,
    UndoImportResult,
} from "@/lib/types";

const api = apiClient;

// Backend response type - may use lastPage instead of totalPages
interface BackendInventoryResponse {
    data: InventoryItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getInventory(params: GetInventoryParams): Promise<InventoryResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("organizationId", params.organizationId);
    if (params.branchId) searchParams.set("branchId", params.branchId);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await api.get<BackendInventoryResponse>(`/inventory?${searchParams}`);

    // Normalize meta - backend uses lastPage, frontend expects totalPages
    const meta = res.data.meta;
    return {
        data: res.data.data,
        meta: {
            total: meta.total,
            page: meta.page,
            limit: meta.limit,
            totalPages: meta.totalPages ?? meta.lastPage ?? 1
        }
    };
}

export async function getInventoryById(id: string): Promise<InventoryItem> {
    const res = await api.get<InventoryItem>(`/inventory/${id}`);
    return res.data;
}

export async function updateInventory(id: string, data: UpdateInventoryInput): Promise<InventoryItem> {
    const res = await api.patch<InventoryItem>(`/inventory/${id}`, data);
    return res.data;
}

export async function addInventory(data: AddInventoryInput): Promise<InventoryItem[]> {
    const res = await api.post<InventoryItem[]>("/inventory/add", data);
    return res.data;
}

export async function addInventoryWithInvoice(
    data: AddInventoryInput,
    invoiceFile?: File
): Promise<InventoryItem[]> {
    if (!invoiceFile) {
        // No file, use regular JSON request
        return addInventory(data);
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Append all data fields
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                // Handle arrays like serialNumbers
                value.forEach((item, index) => {
                    formData.append(`${key}[${index}]`, String(item));
                });
            } else {
                formData.append(key, String(value));
            }
        }
    });

    // Append the invoice file
    formData.append("invoiceFile", invoiceFile);

    const res = await api.post<InventoryItem[]>("/inventory/add", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
}

export async function transferInventory(data: TransferInventoryInput): Promise<TransferResult> {
    const res = await api.post<TransferResult>("/inventory/transfer", data);
    return res.data;
}

export async function importInventory(
    file: File,
    organizationId: string,
    branchId?: string
): Promise<ImportInventoryResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", organizationId);
    if (branchId) {
        formData.append("branchId", branchId);
    }

    const res = await api.post<ImportInventoryResult>("/inventory/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
}

export async function exportInventory(params: ExportInventoryParams): Promise<void> {
    const searchParams = new URLSearchParams();
    searchParams.set("organizationId", params.organizationId);
    if (params.branchId) searchParams.set("branchId", params.branchId);
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);

    const res = await api.get(`/inventory/export?${searchParams}`, {
        responseType: "blob",
    });

    // Create a download link and trigger download
    const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export async function getRecentImports(organizationId?: string): Promise<ImportRecord[]> {
    const searchParams = new URLSearchParams();
    if (organizationId) {
        searchParams.set("organizationId", organizationId);
    }

    const res = await api.get<ImportRecord[]>(`/inventory/imports/recent?${searchParams}`);
    return res.data;
}

export async function undoImport(
    importId: string,
    organizationId?: string
): Promise<UndoImportResult> {
    const res = await api.post<UndoImportResult>(`/inventory/imports/${importId}/undo`, {
        organizationId,
    });
    return res.data;
}
