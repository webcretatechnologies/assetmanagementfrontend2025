import { apiClient } from "./client";
import type { Branch, CreateBranchInput, UpdateBranchInput, PaginatedMeta } from "@/lib/types";

const api = apiClient;

export interface BranchesResponse {
    data: Branch[];
    meta: PaginatedMeta;
}

export interface GetBranchesParams {
    page?: number;
    limit?: number;
    search?: string;
    orgId?: string;
}

// Backend response type - may use lastPage instead of totalPages
interface BackendBranchesResponse {
    data: Branch[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getBranches(params?: GetBranchesParams): Promise<BranchesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.orgId) searchParams.set("orgId", params.orgId);

    const res = await api.get<BackendBranchesResponse | Branch[]>(`/branches?${searchParams}`);

    // Handle both paginated and non-paginated responses
    if (Array.isArray(res.data)) {
        return {
            data: res.data,
            meta: { total: res.data.length, page: 1, limit: res.data.length, totalPages: 1 }
        };
    }

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

export async function getBranchesByOrg(orgId: string): Promise<Branch[]> {
    const res = await api.get<Branch[] | BranchesResponse>(`/branches/org/${orgId}`);

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

export async function getBranch(id: string): Promise<Branch> {
    const res = await api.get<Branch>(`/branches/${id}`);
    return res.data;
}

export async function createBranch(data: CreateBranchInput): Promise<Branch> {
    const res = await api.post<Branch>("/branches", data);
    return res.data;
}

export async function updateBranch(
    id: string,
    data: UpdateBranchInput
): Promise<Branch> {
    const res = await api.put<Branch>(`/branches/${id}`, data);
    return res.data;
}

export async function deleteBranch(id: string): Promise<Branch> {
    const res = await api.delete<Branch>(`/branches/${id}`);
    return res.data;
}

export async function getActiveBranches(): Promise<Branch[]> {
    const res = await api.get<Branch[] | BranchesResponse>("/branches/active");

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
