"use client";

import { useEffect, useState, useCallback } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useAppSelector } from "@/store/hooks";
import { Notification, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/notifications";
import { toast } from "sonner";

export interface UseNotificationsOptions {
    limit?: number;
    includeRead?: boolean;
    showToasts?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
    const { limit = 50, includeRead = false, showToasts = true } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { access_token, isAuthenticated } = useAppSelector((state) => state.auth);

    // Fetch initial notifications
    const fetchNotifications = useCallback(async () => {
        if (!access_token) return;

        try {
            setIsLoading(true);
            const data = await getNotifications({ limit, includeRead });
            setNotifications(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            setError("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    }, [access_token, limit, includeRead]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
        }
    }, []);

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Initial fetch and SSE setup
    useEffect(() => {
        if (!isAuthenticated || !access_token) return;

        // Fetch initial notifications
        fetchNotifications();

        // Setup SSE for real-time updates
        const url = `/api/notifications/stream?token=${encodeURIComponent(access_token)}`;

        const eventSource = new EventSourcePolyfill(url, {
            heartbeatTimeout: 120000,
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        eventSource.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                const newNotification: Notification = JSON.parse(event.data);

                // Add to the beginning of the list
                setNotifications((prev) => {
                    // Avoid duplicates
                    if (prev.some((n) => n.id === newNotification.id)) {
                        return prev;
                    }
                    return [newNotification, ...prev];
                });

                // Show toast for new notifications
                if (showToasts) {
                    const toastFn = newNotification.severity === "CRITICAL" || newNotification.severity === "URGENT"
                        ? toast.error
                        : newNotification.severity === "WARNING"
                            ? toast.warning
                            : toast.info;

                    toastFn(newNotification.title || newNotification.type, {
                        description: newNotification.message,
                    });
                }
            } catch (err) {
                console.error("Error parsing SSE notification:", err);
            }
        };

        eventSource.onerror = () => {
            if (eventSource.readyState === 2) {
                setIsConnected(false);
            }
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [access_token, isAuthenticated, fetchNotifications, showToasts]);

    return {
        notifications,
        unreadCount,
        isLoading,
        isConnected,
        error,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
};
