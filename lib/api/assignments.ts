import { apiClient } from "./client";
import type {
    AssetAssignment,
    AssignmentsResponse,
    CreateAssignmentInput,
    AvailableAsset,
} from "@/lib/types";

const api = apiClient;

export interface GetBranchAssignmentsParams {
    branchId: string;
    organizationId: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
}

export async function createAssignment(data: CreateAssignmentInput): Promise<AssetAssignment> {
    const res = await api.post<AssetAssignment>("/asset-assignments", data);
    return res.data;
}

export async function getUserAssignments(
    userId: string,
    organizationId: string,
    includeHistory = false
): Promise<AssetAssignment[]> {
    const params = new URLSearchParams();
    params.set("organizationId", organizationId);
    params.set("includeHistory", includeHistory.toString());
    const res = await api.get<AssetAssignment[] | AssignmentsResponse>(`/asset-assignments/user/${userId}?${params}`);

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
interface BackendAssignmentsResponse {
    data: AssetAssignment[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getBranchAssignments(params: GetBranchAssignmentsParams): Promise<AssignmentsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.userId) searchParams.set("userId", params.userId);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await api.get<BackendAssignmentsResponse>(`/asset-assignments/branch/${params.branchId}?${searchParams}`);

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

interface AvailableAssetsResponse {
    data: AvailableAsset[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export async function getAvailableAssets(
    organizationId: string,
    branchId?: string,
    search?: string
): Promise<AvailableAsset[]> {
    const params = new URLSearchParams();
    params.set("organizationId", organizationId);
    if (branchId) params.set("branchId", branchId);
    if (search) params.set("search", search);
    const res = await api.get<AvailableAsset[] | AvailableAssetsResponse>(`/asset-assignments/available?${params}`);

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

export async function getAssignment(id: string, organizationId: string): Promise<AssetAssignment> {
    const res = await api.get<AssetAssignment>(`/asset-assignments/${id}?organizationId=${organizationId}`);
    return res.data;
}
