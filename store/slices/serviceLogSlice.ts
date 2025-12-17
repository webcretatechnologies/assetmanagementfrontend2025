import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getServiceLogs,
    getServiceLogById,
    createServiceLog as createServiceLogApi,
    updateServiceLog as updateServiceLogApi,
    deleteServiceLog as deleteServiceLogApi,
} from "@/lib/api/service-logs";
import type {
    ServiceLog,
    ServiceLogsResponse,
    CreateServiceLogInput,
    UpdateServiceLogInput,
    GetServiceLogsParams,
} from "@/lib/types";

interface ServiceLogState {
    serviceLogs: ServiceLog[];
    selectedServiceLog: ServiceLog | null;
    isLoading: boolean;
    error: string | null;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const initialState: ServiceLogState = {
    serviceLogs: [],
    selectedServiceLog: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export const fetchServiceLogs = createAsyncThunk(
    "serviceLogs/fetchAll",
    async (params: GetServiceLogsParams, { rejectWithValue }) => {
        try {
            return await getServiceLogs(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch service logs"
            );
        }
    }
);

export const fetchServiceLogById = createAsyncThunk(
    "serviceLogs/fetchById",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getServiceLogById(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch service log"
            );
        }
    }
);

export const createServiceLog = createAsyncThunk(
    "serviceLogs/create",
    async (data: CreateServiceLogInput, { rejectWithValue }) => {
        try {
            return await createServiceLogApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create service log"
            );
        }
    }
);

export const updateServiceLog = createAsyncThunk(
    "serviceLogs/update",
    async ({ id, data }: { id: string; data: UpdateServiceLogInput }, { rejectWithValue }) => {
        try {
            return await updateServiceLogApi(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update service log"
            );
        }
    }
);

export const deleteServiceLog = createAsyncThunk(
    "serviceLogs/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await deleteServiceLogApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete service log"
            );
        }
    }
);

const serviceLogSlice = createSlice({
    name: "serviceLogs",
    initialState,
    reducers: {
        setSelectedServiceLog(state, action: PayloadAction<ServiceLog | null>) {
            state.selectedServiceLog = action.payload;
        },
        clearServiceLogError(state) {
            state.error = null;
        },
        clearServiceLogs(state) {
            state.serviceLogs = [];
            state.meta = initialState.meta;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch service logs
            .addCase(fetchServiceLogs.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                fetchServiceLogs.fulfilled,
                (state, action: PayloadAction<ServiceLogsResponse>) => {
                    state.isLoading = false;
                    state.serviceLogs = action.payload.data;
                    state.meta = action.payload.meta;
                }
            )
            .addCase(fetchServiceLogs.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch service log by ID
            .addCase(fetchServiceLogById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                fetchServiceLogById.fulfilled,
                (state, action: PayloadAction<ServiceLog>) => {
                    state.isLoading = false;
                    state.selectedServiceLog = action.payload;
                }
            )
            .addCase(fetchServiceLogById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Create service log
            .addCase(createServiceLog.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createServiceLog.fulfilled, (state, action: PayloadAction<ServiceLog>) => {
                state.isLoading = false;
                state.serviceLogs.unshift(action.payload);
                state.meta.total += 1;
            })
            .addCase(createServiceLog.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update service log
            .addCase(updateServiceLog.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateServiceLog.fulfilled, (state, action: PayloadAction<ServiceLog>) => {
                state.isLoading = false;
                const index = state.serviceLogs.findIndex((s) => s.id === action.payload.id);
                if (index !== -1) {
                    state.serviceLogs[index] = action.payload;
                }
                if (state.selectedServiceLog?.id === action.payload.id) {
                    state.selectedServiceLog = action.payload;
                }
            })
            .addCase(updateServiceLog.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete service log
            .addCase(deleteServiceLog.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteServiceLog.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false;
                state.serviceLogs = state.serviceLogs.filter((s) => s.id !== action.payload);
                state.meta.total -= 1;
            })
            .addCase(deleteServiceLog.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedServiceLog, clearServiceLogError, clearServiceLogs } =
    serviceLogSlice.actions;
export default serviceLogSlice.reducer;
