"use client";

import { apiClient } from "./client";
import type {
    ServiceLog,
    ServiceLogsResponse,
    CreateServiceLogInput,
    UpdateServiceLogInput,
    GetServiceLogsParams,
} from "@/lib/types";

const api = apiClient;

// Backend response type
interface BackendServiceLogsResponse {
    data: ServiceLog[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getServiceLogs(params: GetServiceLogsParams): Promise<ServiceLogsResponse> {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.branchId) searchParams.set("branchId", params.branchId);
    if (params.vendorId) searchParams.set("vendorId", params.vendorId);
    if (params.inventoryItemId) searchParams.set("inventoryItemId", params.inventoryItemId);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await api.get<BackendServiceLogsResponse>(`/service-logs?${searchParams}`);

    const meta = res.data.meta;
    return {
        data: res.data.data,
        meta: {
            total: meta.total,
            page: meta.page,
            limit: meta.limit,
            totalPages: meta.totalPages ?? meta.lastPage ?? 1,
        },
    };
}

export async function getServiceLogById(id: string): Promise<ServiceLog> {
    const res = await api.get<ServiceLog>(`/service-logs/${id}`);
    return res.data;
}

export async function getServiceLogsByVendor(vendorId: string): Promise<ServiceLog[]> {
    const res = await api.get<BackendServiceLogsResponse>(
        `/service-logs?vendorId=${vendorId}&limit=100`
    );
    return res.data.data;
}

export async function getServiceLogsByAsset(inventoryItemId: string): Promise<ServiceLog[]> {
    const res = await api.get<BackendServiceLogsResponse>(
        `/service-logs?inventoryItemId=${inventoryItemId}&limit=100`
    );
    return res.data.data;
}

export async function createServiceLog(data: CreateServiceLogInput): Promise<ServiceLog> {
    const res = await api.post<ServiceLog>("/service-logs", data);
    return res.data;
}

export async function updateServiceLog(
    id: string,
    data: UpdateServiceLogInput
): Promise<ServiceLog> {
    const res = await api.patch<ServiceLog>(`/service-logs/${id}`, data);
    return res.data;
}

export async function deleteServiceLog(id: string): Promise<void> {
    await api.delete(`/service-logs/${id}`);
}
