import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardStats } from "@/lib/api/dashboard";
import type { DashboardStats } from "@/lib/types/dashboard";

interface DashboardState {
    stats: DashboardStats | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    stats: null,
    isLoading: false,
    error: null,
};

export const fetchDashboardStats = createAsyncThunk(
    "dashboard/fetchStats",
    async (_, { rejectWithValue }) => {
        try {
            return await getDashboardStats();
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch dashboard stats"
            );
        }
    }
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        clearDashboardError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
