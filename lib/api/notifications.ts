// Notification API functions

// Notification type matching backend API
export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: "CRITICAL" | "URGENT" | "WARNING" | "INFO";
    isRead: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
    createdAt: string;
}

// Get notifications
export async function getNotifications(params?: {
    limit?: number;
    includeRead?: boolean;
}): Promise<Notification[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.includeRead !== undefined) searchParams.set("includeRead", String(params.includeRead));

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`/api/notifications?${searchParams.toString()}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch notifications");
    }

    return response.json();
}

// Mark single notification as read
export async function markNotificationAsRead(id: string): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        throw new Error("Failed to mark notification as read");
    }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
    }
}
