"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@/lib/api/notifications";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    AlertTriangle,
    AlertOctagon,
    AlertCircle,
    Info,
    CheckCircle2,
    Trash2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationsWidget() {
    const { notifications, unreadCount, isConnected, isLoading, markAllAsRead, markAsRead } = useNotifications({
        limit: 50,
        includeRead: true,
        showToasts: true,
    });
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Count by severity
    const criticalCount = notifications.filter((n) => n.severity === "CRITICAL" && !n.isRead).length;
    const urgentCount = notifications.filter((n) => n.severity === "URGENT" && !n.isRead).length;

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
    };

    const handleMarkAllAsRead = async () => {
        try {
            setIsMarkingRead(true);
            await markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        } finally {
            setIsMarkingRead(false);
        }
    };

    // Don't render until mounted
    if (!mounted) return null;

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full transition-all hover:bg-muted"
                >
                    <Bell
                        className={cn(
                            "h-5 w-5 transition-all text-muted-foreground",
                            unreadCount > 0 && "text-foreground animate-swing"
                        )}
                    />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-[2px] text-[10px] font-bold text-white shadow-sm ring-1 ring-background animate-in zoom-in-50 duration-300">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>

            {/* Popover Content - styled as a floating card */}
            <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0 flex flex-col shadow-xl border-border/60 bg-background/95 backdrop-blur-md overflow-hidden rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/40">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        {(criticalCount > 0 || urgentCount > 0) && (
                            <div className="flex gap-1 text-[10px] font-mono">
                                {criticalCount > 0 && (
                                    <Badge variant="destructive" className="h-4 px-1 rounded-sm text-[10px]">
                                        {criticalCount}
                                    </Badge>
                                )}
                                {urgentCount > 0 && (
                                    <Badge className="h-4 px-1 rounded-sm text-[10px] bg-orange-500/10 text-orange-700 border-orange-500/20">
                                        {urgentCount}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* List */}
                <div className="flex-1 max-h-[400px] min-h-[200px] relative">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                            <Bell className="h-8 w-8 opacity-20 animate-pulse" />
                            <p className="text-xs">Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                            <CheckCircle2 className="h-10 w-10 opacity-20 text-emerald-500" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-2">
                            <div className="flex flex-col gap-1 py-2">
                                {notifications.map((notification, i) => (
                                    <NotificationItem
                                        key={notification.id || i}
                                        notification={notification}
                                        onMarkAsRead={() => !notification.isRead && markAsRead(notification.id)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                        disabled={isMarkingRead || notifications.length === 0}
                        onClick={handleMarkAllAsRead}
                    >
                        {isMarkingRead ? "Marking..." : "Mark all as read"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: () => void }) {
    const getStyles = () => {
        switch (notification.severity) {
            case "CRITICAL":
                return {
                    icon: <AlertOctagon className="h-4 w-4 text-red-600" />,
                    bg: "hover:bg-red-500/5",
                    accent: "bg-red-500"
                };
            case "URGENT":
                return {
                    icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
                    bg: "hover:bg-orange-500/5",
                    accent: "bg-orange-500"
                };
            case "WARNING":
                return {
                    icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
                    bg: "hover:bg-yellow-500/5",
                    accent: "bg-yellow-500"
                };
            default:
                return {
                    icon: <Info className="h-4 w-4 text-blue-600" />,
                    bg: "hover:bg-blue-500/5",
                    accent: "bg-blue-500"
                };
        }
    };

    const styles = getStyles();
    const timeAgo = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
        : "Just now";

    return (
        <div
            onClick={onMarkAsRead}
            className={cn(
                "group relative flex gap-3 p-3 rounded-md transition-all cursor-pointer",
                styles.bg,
                !notification.isRead && "bg-primary/5"
            )}
        >
            {/* Unread indicator dot */}
            {!notification.isRead && (
                <span className={cn("absolute left-1 top-4 h-1.5 w-1.5 rounded-full", styles.accent)} />
            )}

            <div className="flex-shrink-0 mt-0.5 ml-2">{styles.icon}</div>
            <div className="flex-1 space-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground/80">
                        {notification.title || notification.type.replace(/_/g, " ")}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                    </span>
                </div>
                <p className="text-sm text-foreground/60 leading-tight">
                    {notification.message}
                </p>
                {notification.metadata && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(notification.metadata)
                            .filter(([k]) => !k.toLowerCase().endsWith('id')) // Filter out ID fields
                            .slice(0, 2)
                            .map(([k, v]) => (
                                <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border/50">
                                    {k}: {String(v)}
                                </span>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}
