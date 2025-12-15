import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getInventory,
    addInventory as addInventoryApi,
    transferInventory as transferInventoryApi,
} from "@/lib/api/inventory";
import type {
    InventoryItem,
    InventoryResponse,
    AddInventoryInput,
    TransferInventoryInput,
    GetInventoryParams,
    TransferResult,
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
}

const initialState: InventoryState = {
    items: [],
    selectedItem: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
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

export const addInventory = createAsyncThunk(
    "inventory/add",
    async (data: AddInventoryInput, { rejectWithValue }) => {
        try {
            return await addInventoryApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to add inventory"
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
            });
    },
});

export const { setSelectedInventoryItem, clearInventoryError, clearInventory } = inventorySlice.actions;
export default inventorySlice.reducer;
