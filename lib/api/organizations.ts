import { apiClient } from "./client";
import type {
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput,
    PaginatedMeta,
} from "@/lib/types";

const api = apiClient;

export interface OrgsResponse {
    data: Organization[];
    meta: PaginatedMeta;
}

export interface GetOrgsParams {
    page?: number;
    limit?: number;
    search?: string;
}

// Backend response type - may use lastPage instead of totalPages
interface BackendOrgsResponse {
    data: Organization[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getOrganizations(params?: GetOrgsParams): Promise<OrgsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);

    const res = await api.get<BackendOrgsResponse | Organization[]>(`/organizations?${searchParams}`);

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

export async function getOrganization(id: string): Promise<Organization> {
    const res = await api.get<Organization>(`/organizations/${id}`);
    return res.data;
}

export async function createOrganization(
    data: CreateOrganizationInput
): Promise<Organization> {
    const res = await api.post<Organization>("/organizations", data);
    return res.data;
}

export async function updateOrganization(
    id: string,
    data: UpdateOrganizationInput
): Promise<Organization> {
    const res = await api.put<Organization>(`/organizations/${id}`, data);
    return res.data;
}

export async function deleteOrganization(id: string): Promise<Organization> {
    const res = await api.delete<Organization>(`/organizations/${id}`);
    return res.data;
}
