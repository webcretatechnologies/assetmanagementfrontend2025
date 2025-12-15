import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    orgId?: string;
    branchId?: string;
}

interface AuthState {
    user: User | null;
    access_token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Helper functions for localStorage
const saveToLocalStorage = (user: User, token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access_token", token);
    }
};

const clearLocalStorage = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
    }
};

const getInitialState = (): AuthState => {
    if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("access_token");

        if (storedUser && storedToken) {
            return {
                user: JSON.parse(storedUser),
                access_token: storedToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        }
    }

    return {
        user: null,
        access_token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
    };
};

const initialState: AuthState = getInitialState();

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (
        credentials: { email: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            // Call NextJS API route which will set the HTTP-only cookie
            const response = await axios.post("/api/auth/login", credentials);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return rejectWithValue(
                    error.response.data.message || "Login failed"
                );
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await axios.post("/api/auth/logout");
            return null;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return rejectWithValue(error.response.data.message || "Logout failed");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; access_token: string }>
        ) => {
            state.user = action.payload.user;
            state.access_token = action.payload.access_token;
            state.isAuthenticated = true;
            saveToLocalStorage(action.payload.user, action.payload.access_token);
        },
        clearCredentials: (state) => {
            state.user = null;
            state.access_token = null;
            state.isAuthenticated = false;
            state.error = null;
            clearLocalStorage();
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            // Update localStorage with new user data
            if (typeof window !== "undefined" && state.access_token) {
                saveToLocalStorage(action.payload, state.access_token);
            }
        },
        clearError: (state) => {
            state.error = null;
        },
        hydrateAuth: (state) => {
            if (typeof window !== "undefined") {
                const storedUser = localStorage.getItem("user");
                const storedToken = localStorage.getItem("access_token");

                if (storedUser && storedToken) {
                    state.user = JSON.parse(storedUser);
                    state.access_token = storedToken;
                    state.isAuthenticated = true;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.access_token = action.payload.access_token;
                state.isAuthenticated = true;
                // Save to localStorage
                saveToLocalStorage(action.payload.user, action.payload.access_token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Logout
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.access_token = null;
                state.isAuthenticated = false;
                state.error = null;
                // Clear localStorage
                clearLocalStorage();
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setCredentials, clearCredentials, clearError, hydrateAuth, setUser } =
    authSlice.actions;
export default authSlice.reducer;

