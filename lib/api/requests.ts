import { apiClient } from "./client";
import type { AssetRequest, RequestsResponse, CreateRequestInput } from "@/lib/types";

const api = apiClient;

export interface GetRequestQueueParams {
    organizationId: string;
    branchId?: string;
    requestType?: string;
    urgency?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export async function createRequest(data: CreateRequestInput): Promise<AssetRequest> {
    const res = await api.post<AssetRequest>("/asset-requests", data);
    return res.data;
}

export async function getMyRequests(organizationId: string): Promise<AssetRequest[]> {
    const res = await api.get<AssetRequest[] | RequestsResponse>(`/asset-requests/my-requests?organizationId=${organizationId}`);

    // Handle both paginated and non-paginated responses from backend
    if (Array.isArray(res.data)) {
        return res.data;
    }
    // Backend returns paginated response { data: [...], meta: {...} }
    if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
        return res.data.data;
    }
    return [];
}

// Backend response type - may use lastPage instead of totalPages
interface BackendRequestsResponse {
    data: AssetRequest[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getRequestQueue(params: GetRequestQueueParams): Promise<RequestsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("organizationId", params.organizationId);
    if (params.branchId) searchParams.set("branchId", params.branchId);
    if (params.requestType) searchParams.set("requestType", params.requestType);
    if (params.urgency) searchParams.set("urgency", params.urgency);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await api.get<BackendRequestsResponse>(`/asset-requests/queue?${searchParams}`);

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

export async function getRequest(id: string, organizationId: string): Promise<AssetRequest> {
    const res = await api.get<AssetRequest>(`/asset-requests/${id}?organizationId=${organizationId}`);
    return res.data;
}

export async function claimRequest(id: string): Promise<AssetRequest> {
    const res = await api.patch<AssetRequest>(`/asset-requests/${id}/claim`);
    return res.data;
}

export async function approveRequest(
    id: string,
    data: { estimatedCompletionDate?: string; resolutionNotes?: string }
): Promise<AssetRequest> {
    const res = await api.patch<AssetRequest>(`/asset-requests/${id}/approve`, data);
    return res.data;
}

export async function rejectRequest(id: string, rejectionReason: string): Promise<AssetRequest> {
    const res = await api.patch<AssetRequest>(`/asset-requests/${id}/reject`, { rejectionReason });
    return res.data;
}

export async function completeRequest(
    id: string,
    data: { completionNotes?: string; conditionOnReturn?: string }
): Promise<AssetRequest> {
    const res = await api.patch<AssetRequest>(`/asset-requests/${id}/complete`, data);
    return res.data;
}
