import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getInventory,
    getInventoryById,
    updateInventory,
    addInventoryWithInvoice,
    transferInventory as transferInventoryApi,
    importInventory as importInventoryApi,
    getRecentImports,
    undoImport,
} from "@/lib/api/inventory";
import type {
    InventoryItem,
    InventoryResponse,
    AddInventoryInput,
    UpdateInventoryInput,
    TransferInventoryInput,
    GetInventoryParams,
    ImportInventoryResult,
    ImportRecord,
} from "@/lib/types";

interface InventoryState {
    items: InventoryItem[];
    selectedItem: InventoryItem | null;
    isLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    // Import state
    isImporting: boolean;
    importResult: ImportInventoryResult | null;
    importError: string | null;
    // Export state
    isExporting: boolean;
    // Import history state
    recentImports: ImportRecord[];
    isLoadingHistory: boolean;
    isUndoing: boolean;
    // Update state
    isUpdating: boolean;
}

const initialState: InventoryState = {
    items: [],
    selectedItem: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    // Import state
    isImporting: false,
    importResult: null,
    importError: null,
    // Export state
    isExporting: false,
    // Import history state
    recentImports: [],
    isLoadingHistory: false,
    isUndoing: false,
    // Update state
    isUpdating: false,
};

export const fetchInventory = createAsyncThunk(
    "inventory/fetchAll",
    async (params: GetInventoryParams, { rejectWithValue }) => {
        try {
            return await getInventory(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch inventory"
            );
        }
    }
);

export const fetchInventoryById = createAsyncThunk(
    "inventory/fetchById",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getInventoryById(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch inventory item"
            );
        }
    }
);

export const addInventory = createAsyncThunk(
    "inventory/add",
    async ({ data, invoiceFile }: { data: AddInventoryInput; invoiceFile?: File }, { rejectWithValue }) => {
        try {
            return await addInventoryWithInvoice(data, invoiceFile);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to add inventory"
            );
        }
    }
);

export const updateInventoryItem = createAsyncThunk(
    "inventory/update",
    async ({ id, data }: { id: string; data: UpdateInventoryInput }, { rejectWithValue }) => {
        try {
            return await updateInventory(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update inventory item"
            );
        }
    }
);

export const transferInventory = createAsyncThunk(
    "inventory/transfer",
    async (data: TransferInventoryInput, { rejectWithValue }) => {
        try {
            return await transferInventoryApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to transfer inventory"
            );
        }
    }
);

export const importInventoryThunk = createAsyncThunk(
    "inventory/import",
    async (
        { file, organizationId, branchId }: { file: File; organizationId: string; branchId?: string },
        { rejectWithValue }
    ) => {
        try {
            return await importInventoryApi(file, organizationId, branchId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to import inventory"
            );
        }
    }
);

export const fetchRecentImportsThunk = createAsyncThunk(
    "inventory/fetchRecentImports",
    async (organizationId: string | undefined, { rejectWithValue }) => {
        try {
            return await getRecentImports(organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch recent imports"
            );
        }
    }
);

export const undoImportThunk = createAsyncThunk(
    "inventory/undoImport",
    async (
        { importId, organizationId }: { importId: string; organizationId?: string },
        { rejectWithValue }
    ) => {
        try {
            return await undoImport(importId, organizationId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to undo import"
            );
        }
    }
);

const inventorySlice = createSlice({
    name: "inventory",
    initialState,
    reducers: {
        setSelectedInventoryItem: (state, action: PayloadAction<InventoryItem | null>) => {
            state.selectedItem = action.payload;
        },
        clearInventoryError: (state) => {
            state.error = null;
        },
        clearInventory: (state) => {
            state.items = [];
            state.meta = initialState.meta;
        },
        clearImportResult: (state) => {
            state.importResult = null;
            state.importError = null;
        },
        setIsExporting: (state, action: PayloadAction<boolean>) => {
            state.isExporting = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<InventoryResponse>) => {
                state.isLoading = false;
                state.items = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchInventory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addInventory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addInventory.fulfilled, (state, action) => {
                state.isLoading = false;
                // Backend may return single item or array - normalize to array
                const payload = action.payload;
                const newItems = Array.isArray(payload) ? payload : [payload];
                state.items = [...newItems, ...state.items];
            })
            .addCase(addInventory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(transferInventory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(transferInventory.fulfilled, (state) => {
                state.isLoading = false;
                // Refresh will be triggered separately
            })
            .addCase(transferInventory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Import cases
            .addCase(importInventoryThunk.pending, (state) => {
                state.isImporting = true;
                state.importError = null;
                state.importResult = null;
            })
            .addCase(importInventoryThunk.fulfilled, (state, action: PayloadAction<ImportInventoryResult>) => {
                state.isImporting = false;
                state.importResult = action.payload;
            })
            .addCase(importInventoryThunk.rejected, (state, action) => {
                state.isImporting = false;
                state.importError = action.payload as string;
            })
            // Recent imports cases
            .addCase(fetchRecentImportsThunk.pending, (state) => {
                state.isLoadingHistory = true;
            })
            .addCase(fetchRecentImportsThunk.fulfilled, (state, action: PayloadAction<ImportRecord[]>) => {
                state.isLoadingHistory = false;
                state.recentImports = action.payload;
            })
            .addCase(fetchRecentImportsThunk.rejected, (state) => {
                state.isLoadingHistory = false;
            })
            // Undo import cases
            .addCase(undoImportThunk.pending, (state) => {
                state.isUndoing = true;
            })
            .addCase(undoImportThunk.fulfilled, (state) => {
                state.isUndoing = false;
            })
            .addCase(undoImportThunk.rejected, (state) => {
                state.isUndoing = false;
            })
            // Fetch single item cases
            .addCase(fetchInventoryById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchInventoryById.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
                state.isLoading = false;
                state.selectedItem = action.payload;
            })
            .addCase(fetchInventoryById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update item cases
            .addCase(updateInventoryItem.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(updateInventoryItem.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
                state.isUpdating = false;
                state.selectedItem = action.payload;
                // Update item in the list if present
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateInventoryItem.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setSelectedInventoryItem,
    clearInventoryError,
    clearInventory,
    clearImportResult,
    setIsExporting,
} = inventorySlice.actions;
export default inventorySlice.reducer;

