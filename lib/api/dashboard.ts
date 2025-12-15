import { apiClient } from "./client";
import type { DashboardStats } from "@/lib/types/dashboard";

export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>("/dashboard/stats");
    return res.data;
}
