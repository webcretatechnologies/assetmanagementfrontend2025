import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getGlobalSettings,
    updateGlobalSettings as updateGlobalSettingsApi,
    getOrgSettings,
    updateOrgSettings as updateOrgSettingsApi,
    getUserSettings,
    updateUserSettings as updateUserSettingsApi,
} from "@/lib/api/settings";
import type {
    GlobalSettings,
    UpdateGlobalSettingsInput,
    OrgSmtpSettings,
    UpdateOrgSmtpSettingsInput,
    UserSettings,
    UpdateUserSettingsInput,
} from "@/lib/types";

interface SettingsState {
    globalSettings: GlobalSettings | null;
    orgSettings: OrgSmtpSettings | null;
    userSettings: UserSettings | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    globalSettings: null,
    orgSettings: null,
    userSettings: null,
    isLoading: false,
    error: null,
};

// User Settings (any authenticated user)
export const fetchUserSettings = createAsyncThunk(
    "settings/fetchUser",
    async (_, { rejectWithValue }) => {
        try {
            return await getUserSettings();
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch user settings"
            );
        }
    }
);

export const updateUserSettings = createAsyncThunk(
    "settings/updateUser",
    async (data: UpdateUserSettingsInput, { rejectWithValue }) => {
        try {
            return await updateUserSettingsApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update user settings"
            );
        }
    }
);

// Global Settings (SUPER_ADMIN only)
export const fetchGlobalSettings = createAsyncThunk(
    "settings/fetchGlobal",
    async (_, { rejectWithValue }) => {
        try {
            return await getGlobalSettings();
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch global settings"
            );
        }
    }
);

export const updateGlobalSettings = createAsyncThunk(
    "settings/updateGlobal",
    async (data: UpdateGlobalSettingsInput, { rejectWithValue }) => {
        try {
            return await updateGlobalSettingsApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update global settings"
            );
        }
    }
);

// Organization Settings
export const fetchOrgSettings = createAsyncThunk(
    "settings/fetchOrg",
    async (orgId: string, { rejectWithValue }) => {
        try {
            return await getOrgSettings(orgId);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch organization settings"
            );
        }
    }
);

export const updateOrgSettings = createAsyncThunk(
    "settings/updateOrg",
    async ({ orgId, data }: { orgId: string; data: UpdateOrgSmtpSettingsInput }, { rejectWithValue }) => {
        try {
            return await updateOrgSettingsApi(orgId, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update organization settings"
            );
        }
    }
);

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        clearSettingsError: (state) => {
            state.error = null;
        },
        clearOrgSettings: (state) => {
            state.orgSettings = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch user settings
            .addCase(fetchUserSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userSettings = action.payload;
            })
            .addCase(fetchUserSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update user settings
            .addCase(updateUserSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUserSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userSettings = action.payload;
            })
            .addCase(updateUserSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch global settings
            .addCase(fetchGlobalSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchGlobalSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.globalSettings = action.payload;
            })
            .addCase(fetchGlobalSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update global settings
            .addCase(updateGlobalSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateGlobalSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.globalSettings = action.payload;
            })
            .addCase(updateGlobalSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch org settings
            .addCase(fetchOrgSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrgSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.orgSettings = action.payload;
            })
            .addCase(fetchOrgSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update org settings
            .addCase(updateOrgSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateOrgSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.orgSettings = action.payload;
            })
            .addCase(updateOrgSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSettingsError, clearOrgSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
