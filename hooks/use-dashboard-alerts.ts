import { useEffect, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useAppSelector } from "@/store/hooks";
import { ROLES, Role } from "@/lib/rbac/permissions";

export interface Alert {
  id: string;
  type: string;
  severity: "CRITICAL" | "URGENT" | "WARNING" | "INFO";
  message: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertSummary {
  critical: number;
  urgent: number;
  warning: number;
}

export interface DashboardAlertsData {
  timestamp: string;
  summary: AlertSummary;
  alerts: Alert[];
}

const ALLOWED_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.BRANCH_MANAGER, ROLES.INVENTORY_OPERATOR];

export const useDashboardAlerts = () => {
  const [data, setData] = useState<DashboardAlertsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, access_token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Don't connect if not authenticated
    if (!isAuthenticated || !access_token) return;

    // Role check
    if (!user || !user.role || !ALLOWED_ROLES.includes(user.role as Role)) {
      return;
    }

    // Use local proxy to avoid CORS issues - pass token via query parameter as fallback
    const url = `/api/notifications/stream?token=${encodeURIComponent(access_token)}`;

    // Create EventSource with token in URL and headers for authentication
    const eventSource = new EventSourcePolyfill(url, {
      heartbeatTimeout: 120000, // 2 minutes
      withCredentials: true, // Send cookies
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log("SSE Connection opened");
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const parsedData: DashboardAlertsData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err: unknown) => {
      // EventSourcePolyfill automatically tries to reconnect
      // Only log if connection is permanently closed
      if (eventSource.readyState === 2) { // CLOSED
        console.warn("SSE Connection closed, will not reconnect");
        setIsConnected(false);
      }

      // On 401/403 we want to close and not retry
      const errorStatus = (err as { status?: number })?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        console.warn("SSE Authentication failed:", errorStatus);
        eventSource.close();
        setIsConnected(false);
        setError("Authentication failed");
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [access_token, user, isAuthenticated]);

  return { data, isConnected, error, isAllowed: user && user.role && ALLOWED_ROLES.includes(user.role as Role) };
};
