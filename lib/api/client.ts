"use client";

import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface ApiErrorResponse {
    message?: string;
    error?: string;
    statusCode?: number;
}

// Create a shared axios client with interceptors
const apiClient = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        // Don't show toast for cancelled requests
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        // Extract error message from API response
        const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "An unexpected error occurred";

        // Show error toast
        toast.error(errorMessage, {
            duration: 5000,
        });

        return Promise.reject(error);
    }
);

export { apiClient };
