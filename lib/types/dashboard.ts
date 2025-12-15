// Dashboard Types

export interface DashboardMetric {
    label: string;
    value: number;
    change?: number;
    icon?: string;
}

export interface DashboardActionItem {
    id: string;
    type: "APPROVAL" | "TASK" | "ALERT";
    message: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    link?: string;
}

export interface DashboardActivity {
    date: string;
    description: string;
    user?: string;
}

export interface DashboardStats {
    metrics: DashboardMetric[];
    actionItems: DashboardActionItem[];
    recentActivity: DashboardActivity[];
}
