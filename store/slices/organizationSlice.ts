import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getOrganizations,
    getOrganization,
    createOrganization as createOrgApi,
    updateOrganization as updateOrgApi,
    deleteOrganization as deleteOrgApi,
    type GetOrgsParams,
} from "@/lib/api/organizations";
import type {
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput,
    PaginatedMeta,
} from "@/lib/types";

interface OrganizationState {
    organizations: Organization[];
    selectedOrganization: Organization | null;
    isLoading: boolean;
    error: string | null;
    meta: PaginatedMeta;
}

const initialState: OrganizationState = {
    organizations: [],
    selectedOrganization: null,
    isLoading: false,
    error: null,
    meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
};

export const fetchOrganizations = createAsyncThunk(
    "organizations/fetchAll",
    async (params: GetOrgsParams | undefined, { rejectWithValue }) => {
        try {
            return await getOrganizations(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch organizations"
            );
        }
    }
);

export const fetchOrganization = createAsyncThunk(
    "organizations/fetchOne",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getOrganization(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch organization"
            );
        }
    }
);

export const createOrganization = createAsyncThunk(
    "organizations/create",
    async (data: CreateOrganizationInput, { rejectWithValue }) => {
        try {
            return await createOrgApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create organization"
            );
        }
    }
);

export const updateOrganization = createAsyncThunk(
    "organizations/update",
    async (
        { id, data }: { id: string; data: UpdateOrganizationInput },
        { rejectWithValue }
    ) => {
        try {
            return await updateOrgApi(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update organization"
            );
        }
    }
);

export const deleteOrganization = createAsyncThunk(
    "organizations/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            return await deleteOrgApi(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete organization"
            );
        }
    }
);

const organizationSlice = createSlice({
    name: "organizations",
    initialState,
    reducers: {
        setSelectedOrganization: (
            state,
            action: PayloadAction<Organization | null>
        ) => {
            state.selectedOrganization = action.payload;
        },
        clearOrganizationError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchOrganizations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.organizations = []; // Clear stale data to prevent wrong page display
            })
            .addCase(fetchOrganizations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.organizations = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchOrganizations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch one
            .addCase(fetchOrganization.fulfilled, (state, action) => {
                state.selectedOrganization = action.payload;
            })
            // Create
            .addCase(createOrganization.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createOrganization.fulfilled, (state, action) => {
                state.isLoading = false;
                state.organizations.push(action.payload);
            })
            .addCase(createOrganization.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update
            .addCase(updateOrganization.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateOrganization.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.organizations.findIndex(
                    (org) => org.id === action.payload.id
                );
                if (index !== -1) {
                    state.organizations[index] = action.payload;
                }
                if (state.selectedOrganization?.id === action.payload.id) {
                    state.selectedOrganization = action.payload;
                }
            })
            .addCase(updateOrganization.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete
            .addCase(deleteOrganization.fulfilled, (state, action) => {
                const index = state.organizations.findIndex(
                    (org) => org.id === action.payload.id
                );
                if (index !== -1) {
                    state.organizations[index] = action.payload;
                }
            });
    },
});

export const { setSelectedOrganization, clearOrganizationError } =
    organizationSlice.actions;
export default organizationSlice.reducer;

