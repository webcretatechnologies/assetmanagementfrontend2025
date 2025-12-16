import { apiClient } from "./client";
import type { Product, ProductsResponse, CreateProductInput, UpdateProductInput } from "@/lib/types";

const api = apiClient;

export interface GetProductsParams {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
}

// Backend response type - may use lastPage instead of totalPages
interface BackendProductsResponse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage?: number;
        totalPages?: number;
    };
}

export async function getProducts(params: GetProductsParams): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("organizationId", params.organizationId);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.categoryId) searchParams.set("categoryId", params.categoryId);

    const res = await api.get<BackendProductsResponse>(`/products?${searchParams.toString()}`);

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

export async function getProduct(id: string, organizationId: string): Promise<Product> {
    const res = await api.get<Product>(`/products/${id}?organizationId=${organizationId}`);
    return res.data;
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
    const res = await api.post<Product>("/products", data);
    return res.data;
}

export async function updateProduct(
    id: string,
    organizationId: string,
    data: UpdateProductInput
): Promise<Product> {
    const res = await api.patch<Product>(`/products/${id}?organizationId=${organizationId}`, data);
    return res.data;
}

export async function deleteProduct(id: string, organizationId: string): Promise<Product> {
    const res = await api.delete<Product>(`/products/${id}?organizationId=${organizationId}`);
    return res.data;
}

export interface ProductLookupResult {
    productType: "ASSET" | "CONSUMABLE";
}

export async function lookupProduct(
    sku: string,
    organizationId: string,
    branchId: string
): Promise<ProductLookupResult> {
    const searchParams = new URLSearchParams();
    searchParams.set("sku", sku);
    searchParams.set("organizationId", organizationId);
    searchParams.set("branchId", branchId);

    const res = await api.get<ProductLookupResult>(`/products/lookup?${searchParams.toString()}`);
    return res.data;
}
