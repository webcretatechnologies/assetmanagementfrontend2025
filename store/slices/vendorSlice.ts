import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getVendors,
    getVendorById,
    getVendorStats,
    createVendor as createVendorApi,
    updateVendor as updateVendorApi,
    deleteVendor as deleteVendorApi,
} from "@/lib/api/vendors";
import type {
    Vendor,
    VendorsResponse,
    CreateVendorInput,
    UpdateVendorInput,
    VendorStats,
    GetVendorsParams,
} from "@/lib/types";

interface VendorState {
    vendors: Vendor[];
    selectedVendor: Vendor | null;
    selectedVendorStats: VendorStats | null;
    isLoading: boolean;
    isStatsLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const initialState: VendorState = {
    vendors: [],
    selectedVendor: null,
    selectedVendorStats: null,
    isLoading: false,
    isStatsLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export const fetchVendors = createAsyncThunk(
    "vendors/fetchAll",
    async (params: GetVendorsParams, { rejectWithValue }) => {
        try {
            return await getVendors(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch vendors"
            );
        }
    }
);

export const fetchVendorById = createAsyncThunk(
    "vendors/fetchById",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getVendorById(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch vendor"
            );
        }
    }
);

export const fetchVendorStats = createAsyncThunk(
    "vendors/fetchStats",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getVendorStats(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch vendor stats"
            );
        }
    }
);

export const createVendor = createAsyncThunk(
    "vendors/create",
    async (data: CreateVendorInput, { rejectWithValue }) => {
        try {
            return await createVendorApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create vendor"
            );
        }
    }
);

export const updateVendor = createAsyncThunk(
    "vendors/update",
    async ({ id, data }: { id: string; data: UpdateVendorInput }, { rejectWithValue }) => {
        try {
            return await updateVendorApi(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update vendor"
            );
        }
    }
);

export const deleteVendor = createAsyncThunk(
    "vendors/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            return await deleteVendorApi(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete vendor"
            );
        }
    }
);

const vendorSlice = createSlice({
    name: "vendors",
    initialState,
    reducers: {
        setSelectedVendor(state, action: PayloadAction<Vendor | null>) {
            state.selectedVendor = action.payload;
        },
        clearVendorError(state) {
            state.error = null;
        },
        clearVendors(state) {
            state.vendors = [];
            state.meta = initialState.meta;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch vendors
            .addCase(fetchVendors.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVendors.fulfilled, (state, action: PayloadAction<VendorsResponse>) => {
                state.isLoading = false;
                state.vendors = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchVendors.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch vendor by ID
            .addCase(fetchVendorById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVendorById.fulfilled, (state, action: PayloadAction<Vendor>) => {
                state.isLoading = false;
                state.selectedVendor = action.payload;
            })
            .addCase(fetchVendorById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch vendor stats
            .addCase(fetchVendorStats.pending, (state) => {
                state.isStatsLoading = true;
            })
            .addCase(fetchVendorStats.fulfilled, (state, action: PayloadAction<VendorStats>) => {
                state.isStatsLoading = false;
                state.selectedVendorStats = action.payload;
            })
            .addCase(fetchVendorStats.rejected, (state) => {
                state.isStatsLoading = false;
            })
            // Create vendor
            .addCase(createVendor.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createVendor.fulfilled, (state, action: PayloadAction<Vendor>) => {
                state.isLoading = false;
                state.vendors.unshift(action.payload);
                state.meta.total += 1;
            })
            .addCase(createVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update vendor
            .addCase(updateVendor.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateVendor.fulfilled, (state, action: PayloadAction<Vendor>) => {
                state.isLoading = false;
                const index = state.vendors.findIndex((v) => v.id === action.payload.id);
                if (index !== -1) {
                    state.vendors[index] = action.payload;
                }
                if (state.selectedVendor?.id === action.payload.id) {
                    state.selectedVendor = action.payload;
                }
            })
            .addCase(updateVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete vendor
            .addCase(deleteVendor.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteVendor.fulfilled, (state, action: PayloadAction<Vendor>) => {
                state.isLoading = false;
                // Update the vendor in list to reflect INACTIVE status
                const index = state.vendors.findIndex((v) => v.id === action.payload.id);
                if (index !== -1) {
                    state.vendors[index] = action.payload;
                }
            })
            .addCase(deleteVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedVendor, clearVendorError, clearVendors } = vendorSlice.actions;
export default vendorSlice.reducer;
