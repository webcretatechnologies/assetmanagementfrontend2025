import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getCategories,
    getCategory,
    createCategory as createCategoryApi,
    updateCategory as updateCategoryApi,
    deleteCategory as deleteCategoryApi,
    GetCategoriesParams,
} from "@/lib/api/categories";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/types";

interface PaginatedMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface CategoryState {
    categories: Category[];
    selectedCategory: Category | null;
    isLoading: boolean;
    error: string | null;
    meta: PaginatedMeta;
}

const initialState: CategoryState = {
    categories: [],
    selectedCategory: null,
    isLoading: false,
    error: null,
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

export const fetchCategories = createAsyncThunk(
    "categories/fetchAll",
    async (params: GetCategoriesParams, { rejectWithValue }) => {
        try {
            return await getCategories(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch categories"
            );
        }
    }
);

export const fetchCategory = createAsyncThunk(
    "categories/fetchOne",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await getCategory(id, organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch category"
            );
        }
    }
);

export const createCategory = createAsyncThunk(
    "categories/create",
    async (data: CreateCategoryInput, { rejectWithValue }) => {
        try {
            return await createCategoryApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create category"
            );
        }
    }
);

export const updateCategory = createAsyncThunk(
    "categories/update",
    async (
        { id, organizationId, data }: { id: string; organizationId: string; data: UpdateCategoryInput },
        { rejectWithValue }
    ) => {
        try {
            return await updateCategoryApi(id, organizationId, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update category"
            );
        }
    }
);

export const deleteCategory = createAsyncThunk(
    "categories/delete",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await deleteCategoryApi(id, organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete category"
            );
        }
    }
);

const categorySlice = createSlice({
    name: "categories",
    initialState,
    reducers: {
        setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
            state.selectedCategory = action.payload;
        },
        clearCategoryError: (state) => {
            state.error = null;
        },
        clearCategories: (state) => {
            state.categories = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch one
            .addCase(fetchCategory.fulfilled, (state, action) => {
                state.selectedCategory = action.payload;
            })
            // Create
            .addCase(createCategory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories.push(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update
            .addCase(updateCategory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.categories.findIndex(
                    (cat) => cat.id === action.payload.id
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
                if (state.selectedCategory?.id === action.payload.id) {
                    state.selectedCategory = action.payload;
                }
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete
            .addCase(deleteCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(
                    (cat) => cat.id === action.payload.id
                );
                if (index !== -1) {
                    state.categories.splice(index, 1);
                }
            });
    },
});

export const { setSelectedCategory, clearCategoryError, clearCategories } = categorySlice.actions;
export default categorySlice.reducer;
