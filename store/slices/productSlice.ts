import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getProducts,
    getProduct,
    createProduct as createProductApi,
    updateProduct as updateProductApi,
    deleteProduct as deleteProductApi,
    GetProductsParams,
} from "@/lib/api/products";
import type { Product, ProductsResponse, CreateProductInput, UpdateProductInput } from "@/lib/types";

interface ProductState {
    products: Product[];
    selectedProduct: Product | null;
    isLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const initialState: ProductState = {
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
    meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    },
};

export const fetchProducts = createAsyncThunk(
    "products/fetchAll",
    async (params: GetProductsParams, { rejectWithValue }) => {
        try {
            return await getProducts(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch products"
            );
        }
    }
);

export const fetchProduct = createAsyncThunk(
    "products/fetchOne",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await getProduct(id, organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch product"
            );
        }
    }
);

export const createProduct = createAsyncThunk(
    "products/create",
    async (data: CreateProductInput, { rejectWithValue }) => {
        try {
            return await createProductApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create product"
            );
        }
    }
);

export const updateProduct = createAsyncThunk(
    "products/update",
    async (
        { id, organizationId, data }: { id: string; organizationId: string; data: UpdateProductInput },
        { rejectWithValue }
    ) => {
        try {
            return await updateProductApi(id, organizationId, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update product"
            );
        }
    }
);

export const deleteProduct = createAsyncThunk(
    "products/delete",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await deleteProductApi(id, organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete product"
            );
        }
    }
);

const productSlice = createSlice({
    name: "products",
    initialState,
    reducers: {
        setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
            state.selectedProduct = action.payload;
        },
        clearProductError: (state) => {
            state.error = null;
        },
        clearProducts: (state) => {
            state.products = [];
            state.meta = initialState.meta;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductsResponse>) => {
                state.isLoading = false;
                state.products = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch one
            .addCase(fetchProduct.fulfilled, (state, action) => {
                state.selectedProduct = action.payload;
            })
            // Create
            .addCase(createProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products.unshift(action.payload);
                state.meta.total += 1;
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update
            .addCase(updateProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.products.findIndex(
                    (p) => p.id === action.payload.id
                );
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                if (state.selectedProduct?.id === action.payload.id) {
                    state.selectedProduct = action.payload;
                }
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete
            .addCase(deleteProduct.fulfilled, (state, action) => {
                const index = state.products.findIndex(
                    (p) => p.id === action.payload.id
                );
                if (index !== -1) {
                    state.products.splice(index, 1);
                    state.meta.total -= 1;
                }
            });
    },
});

export const { setSelectedProduct, clearProductError, clearProducts } = productSlice.actions;
export default productSlice.reducer;
