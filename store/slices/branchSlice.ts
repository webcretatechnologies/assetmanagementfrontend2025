import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getBranches,
    getBranchesByOrg,
    getBranch,
    createBranch as createBranchApi,
    updateBranch as updateBranchApi,
    deleteBranch as deleteBranchApi,
    getActiveBranches,
    type GetBranchesParams,
} from "@/lib/api/branches";
import type { Branch, CreateBranchInput, UpdateBranchInput, PaginatedMeta } from "@/lib/types";

interface BranchState {
    branches: Branch[];
    activeBranches: Branch[]; // Active branches for transfer dropdowns
    selectedBranch: Branch | null;
    isLoading: boolean;
    error: string | null;
    meta: PaginatedMeta;
}

const initialState: BranchState = {
    branches: [],
    activeBranches: [],
    selectedBranch: null,
    isLoading: false,
    error: null,
    meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
};

export const fetchBranches = createAsyncThunk(
    "branches/fetchAll",
    async (params: GetBranchesParams | undefined, { rejectWithValue }) => {
        try {
            return await getBranches(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch branches"
            );
        }
    }
);

export const fetchBranchesByOrg = createAsyncThunk(
    "branches/fetchByOrg",
    async (orgId: string, { rejectWithValue }) => {
        try {
            return await getBranchesByOrg(orgId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch branches"
            );
        }
    }
);

export const fetchBranch = createAsyncThunk(
    "branches/fetchOne",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getBranch(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch branch"
            );
        }
    }
);

export const createBranch = createAsyncThunk(
    "branches/create",
    async (data: CreateBranchInput, { rejectWithValue }) => {
        try {
            return await createBranchApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create branch"
            );
        }
    }
);

export const updateBranch = createAsyncThunk(
    "branches/update",
    async (
        { id, data }: { id: string; data: UpdateBranchInput },
        { rejectWithValue }
    ) => {
        try {
            return await updateBranchApi(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update branch"
            );
        }
    }
);

export const deleteBranch = createAsyncThunk(
    "branches/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            return await deleteBranchApi(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete branch"
            );
        }
    }
);

export const fetchActiveBranches = createAsyncThunk(
    "branches/fetchActive",
    async (_, { rejectWithValue }) => {
        try {
            return await getActiveBranches();
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch active branches"
            );
        }
    }
);

const branchSlice = createSlice({
    name: "branches",
    initialState,
    reducers: {
        setSelectedBranch: (state, action: PayloadAction<Branch | null>) => {
            state.selectedBranch = action.payload;
        },
        clearBranchError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all with pagination
            .addCase(fetchBranches.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.branches = []; // Clear stale data
            })
            .addCase(fetchBranches.fulfilled, (state, action) => {
                state.isLoading = false;
                state.branches = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchBranches.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch by org (returns array, not paginated)
            .addCase(fetchBranchesByOrg.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBranchesByOrg.fulfilled, (state, action) => {
                state.isLoading = false;
                state.branches = action.payload;
            })
            .addCase(fetchBranchesByOrg.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch one
            .addCase(fetchBranch.fulfilled, (state, action) => {
                state.selectedBranch = action.payload;
            })
            // Create
            .addCase(createBranch.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createBranch.fulfilled, (state, action) => {
                state.isLoading = false;
                state.branches.push(action.payload);
            })
            .addCase(createBranch.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update
            .addCase(updateBranch.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateBranch.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.branches.findIndex(
                    (branch) => branch.id === action.payload.id
                );
                if (index !== -1) {
                    state.branches[index] = action.payload;
                }
                if (state.selectedBranch?.id === action.payload.id) {
                    state.selectedBranch = action.payload;
                }
            })
            .addCase(updateBranch.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete
            .addCase(deleteBranch.fulfilled, (state, action) => {
                const index = state.branches.findIndex(
                    (branch) => branch.id === action.payload.id
                );
                if (index !== -1) {
                    state.branches[index] = action.payload;
                }
            })
            // Fetch active branches
            .addCase(fetchActiveBranches.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchActiveBranches.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activeBranches = action.payload;
            })
            .addCase(fetchActiveBranches.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedBranch, clearBranchError } = branchSlice.actions;
export default branchSlice.reducer;

