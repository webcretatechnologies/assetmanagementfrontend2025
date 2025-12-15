import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login", { email, password });
    return res.data;
}
