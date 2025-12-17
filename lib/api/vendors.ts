"use client";

import { apiClient } from "./client";
import type {
    Vendor,
    VendorsResponse,
    CreateVendorInput,
    UpdateVendorInput,
    VendorStats,
    GetVendorsParams,
} from "@/lib/types";

const api = apiClient;

// Backend response type
interface BackendVendorsResponse {
    data: Vendor[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getVendors(params: GetVendorsParams): Promise<VendorsResponse> {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.search) searchParams.set("search", params.search);
    if (params.type) searchParams.set("type", params.type);
    if (params.category) searchParams.set("category", params.category);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await api.get<BackendVendorsResponse>(`/vendors?${searchParams}`);

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

export async function getVendorById(id: string): Promise<Vendor> {
    const res = await api.get<Vendor>(`/vendors/${id}`);
    return res.data;
}

export async function getVendorStats(id: string): Promise<VendorStats> {
    const res = await api.get<VendorStats>(`/vendors/${id}/stats`);
    return res.data;
}

export async function getSuppliers(organizationId?: string): Promise<Vendor[]> {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);
    searchParams.set("type", "SUPPLIER");
    searchParams.set("status", "ACTIVE");
    searchParams.set("limit", "100");

    const res = await api.get<BackendVendorsResponse>(`/vendors?${searchParams}`);
    return res.data.data;
}

export async function getServiceProviders(organizationId?: string): Promise<Vendor[]> {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);
    searchParams.set("type", "SERVICE_PROVIDER");
    searchParams.set("status", "ACTIVE");
    searchParams.set("limit", "100");

    const res = await api.get<BackendVendorsResponse>(`/vendors?${searchParams}`);
    return res.data.data;
}

export async function createVendor(data: CreateVendorInput): Promise<Vendor> {
    const res = await api.post<Vendor>("/vendors", data);
    return res.data;
}

export async function updateVendor(id: string, data: UpdateVendorInput): Promise<Vendor> {
    const res = await api.patch<Vendor>(`/vendors/${id}`, data);
    return res.data;
}

export async function deleteVendor(id: string): Promise<Vendor> {
    const res = await api.delete<Vendor>(`/vendors/${id}`);
    return res.data;
}
