import { apiClient } from "./client";
import type { User, CreateUserInput, UpdateUserInput, PaginatedMeta } from "@/lib/types";

const api = apiClient;

export interface UsersResponse {
    data: User[];
    meta: PaginatedMeta;
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}

// Backend response type - may use lastPage instead of totalPages
interface BackendUsersResponse {
    data: User[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getUsers(params?: GetUsersParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.status) searchParams.set("status", params.status);

    const res = await api.get<BackendUsersResponse | User[]>(`/users?${searchParams}`);

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

export async function getUsersByOrg(orgId: string, params?: GetUsersParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.status) searchParams.set("status", params.status);

    const res = await api.get<BackendUsersResponse | User[]>(`/users/org/${orgId}?${searchParams}`);

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

export async function getUser(id: string): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
}

export async function createUser(data: CreateUserInput): Promise<User> {
    const res = await api.post<User>("/users", data);
    return res.data;
}

export async function updateUser(
    id: string,
    data: UpdateUserInput
): Promise<User> {
    const res = await api.put<User>(`/users/${id}`, data);
    return res.data;
}

export async function deleteUser(id: string): Promise<User> {
    const res = await api.delete<User>(`/users/${id}`);
    return res.data;
}

export interface UpdateProfileInput {
    firstName?: string;
    lastName?: string;
    currentPassword?: string;
    newPassword?: string;
}

export async function updateProfile(data: UpdateProfileInput): Promise<User> {
    const res = await api.patch<User>("/users/profile", data);
    return res.data;
}
