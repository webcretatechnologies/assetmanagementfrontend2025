import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    createRequest as createRequestApi,
    getMyRequests,
    getRequestQueue,
    getRequest,
    claimRequest as claimRequestApi,
    approveRequest as approveRequestApi,
    rejectRequest as rejectRequestApi,
    completeRequest as completeRequestApi,
    GetRequestQueueParams,
} from "@/lib/api/requests";
import type { AssetRequest, RequestsResponse, CreateRequestInput } from "@/lib/types";

interface RequestState {
    requests: AssetRequest[];
    myRequests: AssetRequest[];
    selectedRequest: AssetRequest | null;
    isLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const initialState: RequestState = {
    requests: [],
    myRequests: [],
    selectedRequest: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export const createRequest = createAsyncThunk(
    "requests/create",
    async (data: CreateRequestInput, { rejectWithValue }) => {
        try {
            return await createRequestApi(data);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to create request");
        }
    }
);

export const fetchMyRequests = createAsyncThunk(
    "requests/fetchMyRequests",
    async (organizationId: string, { rejectWithValue }) => {
        try {
            return await getMyRequests(organizationId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch my requests");
        }
    }
);

export const fetchRequestQueue = createAsyncThunk(
    "requests/fetchQueue",
    async (params: GetRequestQueueParams, { rejectWithValue }) => {
        try {
            return await getRequestQueue(params);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch request queue");
        }
    }
);

export const fetchRequest = createAsyncThunk(
    "requests/fetchOne",
    async ({ id, organizationId }: { id: string; organizationId: string }, { rejectWithValue }) => {
        try {
            return await getRequest(id, organizationId);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch request");
        }
    }
);

export const claimRequest = createAsyncThunk(
    "requests/claim",
    async (id: string, { rejectWithValue }) => {
        try {
            return await claimRequestApi(id);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to claim request");
        }
    }
);

export const approveRequest = createAsyncThunk(
    "requests/approve",
    async ({ id, data }: { id: string; data: { estimatedCompletionDate?: string; resolutionNotes?: string } }, { rejectWithValue }) => {
        try {
            return await approveRequestApi(id, data);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to approve request");
        }
    }
);

export const rejectRequest = createAsyncThunk(
    "requests/reject",
    async ({ id, rejectionReason }: { id: string; rejectionReason: string }, { rejectWithValue }) => {
        try {
            return await rejectRequestApi(id, rejectionReason);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to reject request");
        }
    }
);

export const completeRequest = createAsyncThunk(
    "requests/complete",
    async ({ id, data }: { id: string; data: { completionNotes?: string; conditionOnReturn?: string } }, { rejectWithValue }) => {
        try {
            return await completeRequestApi(id, data);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to complete request");
        }
    }
);

const requestSlice = createSlice({
    name: "requests",
    initialState,
    reducers: {
        setSelectedRequest: (state, action: PayloadAction<AssetRequest | null>) => {
            state.selectedRequest = action.payload;
        },
        clearRequestError: (state) => {
            state.error = null;
        },
        clearRequests: (state) => {
            state.requests = [];
            state.meta = initialState.meta;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myRequests.unshift(action.payload);
            })
            .addCase(createRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchMyRequests.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchMyRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myRequests = action.payload;
            })
            .addCase(fetchMyRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchRequestQueue.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchRequestQueue.fulfilled, (state, action: PayloadAction<RequestsResponse>) => {
                state.isLoading = false;
                state.requests = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchRequestQueue.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchRequest.fulfilled, (state, action) => {
                state.selectedRequest = action.payload;
            })
            .addCase(claimRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex((r) => r.id === action.payload.id);
                if (index !== -1) state.requests[index] = action.payload;
            })
            .addCase(approveRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex((r) => r.id === action.payload.id);
                if (index !== -1) state.requests[index] = action.payload;
            })
            .addCase(rejectRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex((r) => r.id === action.payload.id);
                if (index !== -1) state.requests[index] = action.payload;
            })
            .addCase(completeRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex((r) => r.id === action.payload.id);
                if (index !== -1) state.requests[index] = action.payload;
            });
    },
});

export const { setSelectedRequest, clearRequestError, clearRequests } = requestSlice.actions;
export default requestSlice.reducer;
