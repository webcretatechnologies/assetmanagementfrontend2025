import { apiClient } from "./client";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/types";

const api = apiClient;

interface CategoriesResponse {
    data: Category[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GetCategoriesParams {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
}

export async function getCategories(params: GetCategoriesParams): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('organizationId', params.organizationId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const res = await api.get<Category[] | { data: Category[]; meta: { total: number; page: number; limit: number; lastPage?: number; totalPages?: number } }>(`/categories?${queryParams.toString()}`);

    // Handle both paginated and non-paginated responses
    if (Array.isArray(res.data)) {
        return {
            data: res.data,
            meta: { total: res.data.length, page: 1, limit: res.data.length, totalPages: 1 }
        };
    }
    // If response has a data property with the array
    if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
        const meta = res.data.meta;
        return {
            data: res.data.data,
            meta: {
                total: meta?.total ?? res.data.data.length,
                page: meta?.page ?? 1,
                limit: meta?.limit ?? res.data.data.length,
                totalPages: meta?.totalPages ?? meta?.lastPage ?? 1
            }
        };
    }
    return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
}

export async function getCategory(id: string, organizationId: string): Promise<Category> {
    const res = await api.get<Category>(`/categories/${id}?organizationId=${organizationId}`);
    return res.data;
}

export async function createCategory(data: CreateCategoryInput): Promise<Category> {
    const res = await api.post<Category>("/categories", data);
    return res.data;
}

export async function updateCategory(
    id: string,
    organizationId: string,
    data: UpdateCategoryInput
): Promise<Category> {
    const res = await api.patch<Category>(`/categories/${id}?organizationId=${organizationId}`, data);
    return res.data;
}

export async function deleteCategory(id: string, organizationId: string): Promise<Category> {
    const res = await api.delete<Category>(`/categories/${id}?organizationId=${organizationId}`);
    return res.data;
}
