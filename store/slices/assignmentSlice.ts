import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    createAssignment as createAssignmentApi,
    getUserAssignments,
    getBranchAssignments,
    getAvailableAssets,
    getAssignment,
    GetBranchAssignmentsParams,
} from "@/lib/api/assignments";
import type { AssetAssignment, AssignmentsResponse, CreateAssignmentInput, AvailableAsset } from "@/lib/types";

interface AssignmentState {
    assignments: AssetAssignment[];
    userAssignments: AssetAssignment[];
    availableAssets: AvailableAsset[];
    selectedAssignment: AssetAssignment | null;
    isLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const initialState: AssignmentState = {
    assignments: [],
    userAssignments: [],
    availableAssets: [],
    selectedAssignment: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export const createAssignment = createAsyncThunk(
    "assignments/create",
    async (data: CreateAssignmentInput, { rejectWithValue }) => {
        try {
            return await createAssignmentApi(data);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to create assignment");
        }
    }
);

export const fetchUserAssignments = createAsyncThunk(
    "assignments/fetchUserAssignments",
    async ({ userId, organizationId, includeHistory }: { userId: string; organizationId: string; includeHistory?: boolean }, { rejectWithValue }) => {
        try {
            return await getUserAssignments(userId, organizationId, includeHistory);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch user assignments");
        }
    }
);

export const fetchBranchAssignments = createAsyncThunk(
    "assignments/fetchBranchAssignments",
    async (params: GetBranchAssignmentsParams, { rejectWithValue }) => {
        try {
            return await getBranchAssignments(params);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch branch assignments");
        }
    }
);

export const fetchAvailableAssets = createAsyncThunk(
    "assignments/fetchAvailableAssets",
    async ({ organizationId, branchId, search }: { organizationId: string; branchId?: string; search?: string }, { rejectWithValue }) => {
        try {
            return await getAvailableAssets(organizationId, branchId, search);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch available assets");
        }
    }
);

export const fetchAssignment = createAsyncThunk(
    "assignments/fetchOne",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await getAssignment(id, organizationId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch assignment");
        }
    }
);

const assignmentSlice = createSlice({
    name: "assignments",
    initialState,
    reducers: {
        setSelectedAssignment: (state, action: PayloadAction<AssetAssignment | null>) => {
            state.selectedAssignment = action.payload;
        },
        clearAssignmentError: (state) => {
            state.error = null;
        },
        clearAssignments: (state) => {
            state.assignments = [];
            state.meta = initialState.meta;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createAssignment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAssignment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.assignments.unshift(action.payload);
            })
            .addCase(createAssignment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchUserAssignments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUserAssignments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userAssignments = action.payload;
            })
            .addCase(fetchUserAssignments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchBranchAssignments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchBranchAssignments.fulfilled, (state, action: PayloadAction<AssignmentsResponse>) => {
                state.isLoading = false;
                state.assignments = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchBranchAssignments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAvailableAssets.fulfilled, (state, action) => {
                state.availableAssets = action.payload;
            })
            .addCase(fetchAssignment.fulfilled, (state, action) => {
                state.selectedAssignment = action.payload;
            });
    },
});

export const { setSelectedAssignment, clearAssignmentError, clearAssignments } = assignmentSlice.actions;
export default assignmentSlice.reducer;
