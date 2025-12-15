"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboardStats } from "@/store/slices/dashboardSlice";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    Building2,
    Package,
    Box,
    ClipboardList,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Globe,
    Monitor,
    UserCheck,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Icon map for dynamic icon rendering
const iconMap: Record<string, React.ElementType> = {
    users: Users,
    building: Building2,
    package: Package,
    box: Box,
    clipboard: ClipboardList,
    alert: AlertTriangle,
    clock: Clock,
    check: CheckCircle2,
    globe: Globe,
    monitor: Monitor,
    "user-check": UserCheck,
    "check-circle": CheckCircle,
};

const getIcon = (iconName?: string) => {
    if (!iconName) return Package;
    return iconMap[iconName.toLowerCase()] || Package;
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "HIGH":
            return "border-red-500/50 bg-red-500/10";
        case "MEDIUM":
            return "border-amber-500/50 bg-amber-500/10";
        case "LOW":
            return "border-green-500/50 bg-green-500/10";
        default:
            return "border-border";
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
};

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const [mounted, setMounted] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const { stats, isLoading } = useAppSelector((state) => state.dashboard);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user) {
            dispatch(fetchDashboardStats());
        }
    }, [dispatch, user]);

    // Use consistent fallback for SSR/client
    const userName = mounted
        ? (user?.firstName || user?.email?.split("@")[0] || "User")
        : "User";

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    Welcome back
                    <span className="text-primary">, {userName}</span>!
                </h1>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your inventory today.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Metrics Grid */}
                    {stats?.metrics && stats.metrics.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {stats.metrics.map((metric, index) => {
                                const Icon = getIcon(metric.icon);
                                return (
                                    <Card key={index} className="relative overflow-hidden">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                {metric.label}
                                            </CardTitle>
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                                            {metric.change !== undefined && (
                                                <div className="flex items-center gap-1 text-xs mt-1">
                                                    <span
                                                        className={
                                                            metric.change >= 0
                                                                ? "text-emerald-500"
                                                                : "text-red-500"
                                                        }
                                                    >
                                                        {metric.change >= 0 ? "+" : ""}
                                                        {metric.change}%
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        from last period
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary/10" />
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Action Items & Recent Activity */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Action Items */}
                        {stats?.actionItems && stats.actionItems.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        Action Required
                                    </CardTitle>
                                    <CardDescription>
                                        Items that need your attention
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.actionItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(
                                                    item.priority
                                                )}`}
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {item.message}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                                            {item.type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Priority: {item.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.link && (
                                                    <Link href={item.link}>
                                                        <Button variant="ghost" size="sm">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activity */}
                        {stats?.recentActivity && stats.recentActivity.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>
                                        Latest updates and changes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {stats.recentActivity.map((activity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {activity.description}
                                                    </p>
                                                    {activity.user && (
                                                        <p className="text-xs text-muted-foreground">
                                                            by {activity.user}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(activity.date)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions - Only show if no action items */}
                        {(!stats?.actionItems || stats.actionItems.length === 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>
                                        Common tasks and shortcuts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Link
                                            href="/inventory"
                                            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Box className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">View Inventory</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Browse all items
                                                </p>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/requests"
                                            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <ClipboardList className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">View Requests</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Check request status
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Empty State for Recent Activity */}
                        {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>
                                        Latest updates and changes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">No recent activity</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
