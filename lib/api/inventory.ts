"use client";

import { apiClient } from "./client";
import type {
    InventoryItem,
    InventoryResponse,
    AddInventoryInput,
    TransferInventoryInput,
    GetInventoryParams,
    TransferResult,
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

export async function addInventory(data: AddInventoryInput): Promise<InventoryItem[]> {
    const res = await api.post<InventoryItem[]>("/inventory/add", data);
    return res.data;
}

export async function transferInventory(data: TransferInventoryInput): Promise<TransferResult> {
    const res = await api.post<TransferResult>("/inventory/transfer", data);
    return res.data;
}
