import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    getUsers,
    getUsersByOrg,
    getUser,
    createUser as createUserApi,
    updateUser as updateUserApi,
    deleteUser as deleteUserApi,
    type UsersResponse,
    type GetUsersParams,
} from "@/lib/api/users";
import type { User, CreateUserInput, UpdateUserInput, PaginatedMeta } from "@/lib/types";

interface UserState {
    users: User[];
    selectedUser: User | null;
    isLoading: boolean;
    error: string | null;
    meta: PaginatedMeta;
}

const initialState: UserState = {
    users: [],
    selectedUser: null,
    isLoading: false,
    error: null,
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
};

export interface FetchUsersPayload extends GetUsersParams {
    orgId?: string;
}

export const fetchUsers = createAsyncThunk(
    "users/fetchAll",
    async (params: GetUsersParams | undefined, { rejectWithValue }) => {
        try {
            return await getUsers(params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch users"
            );
        }
    }
);

export const fetchUsersByOrg = createAsyncThunk(
    "users/fetchByOrg",
    async ({ orgId, ...params }: { orgId: string } & GetUsersParams, { rejectWithValue }) => {
        try {
            return await getUsersByOrg(orgId, params);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch users"
            );
        }
    }
);

export const fetchUser = createAsyncThunk(
    "users/fetchOne",
    async (id: string, { rejectWithValue }) => {
        try {
            return await getUser(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to fetch user"
            );
        }
    }
);

export const createUser = createAsyncThunk(
    "users/create",
    async (data: CreateUserInput, { rejectWithValue }) => {
        try {
            return await createUserApi(data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to create user"
            );
        }
    }
);

export const updateUser = createAsyncThunk(
    "users/update",
    async (
        { id, data }: { id: string; data: UpdateUserInput },
        { rejectWithValue }
    ) => {
        try {
            return await updateUserApi(id, data);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to update user"
            );
        }
    }
);

export const deleteUser = createAsyncThunk(
    "users/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            return await deleteUserApi(id);
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "Failed to delete user"
            );
        }
    }
);

const userSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        setSelectedUser: (state, action: PayloadAction<User | null>) => {
            state.selectedUser = action.payload;
        },
        clearUserError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.users = []; // Clear old data to prevent stale display
            })
            .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UsersResponse>) => {
                state.isLoading = false;
                state.users = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch by org
            .addCase(fetchUsersByOrg.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.users = []; // Clear old data to prevent stale display
            })
            .addCase(fetchUsersByOrg.fulfilled, (state, action: PayloadAction<UsersResponse>) => {
                state.isLoading = false;
                state.users = action.payload.data;
                state.meta = action.payload.meta;
            })
            .addCase(fetchUsersByOrg.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch one
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.selectedUser = action.payload;
            })
            // Create
            .addCase(createUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users.push(action.payload);
            })
            .addCase(createUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update
            .addCase(updateUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.users.findIndex(
                    (user) => user.id === action.payload.id
                );
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
                if (state.selectedUser?.id === action.payload.id) {
                    state.selectedUser = action.payload;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete
            .addCase(deleteUser.fulfilled, (state, action) => {
                const index = state.users.findIndex(
                    (user) => user.id === action.payload.id
                );
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
            });
    },
});

export const { setSelectedUser, clearUserError } = userSlice.actions;
export default userSlice.reducer;
