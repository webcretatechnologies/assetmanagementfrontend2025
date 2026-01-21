"use client";

import { useDashboardAlerts, Alert } from "@/hooks/use-dashboard-alerts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    AlertTriangle,
    AlertOctagon,
    AlertCircle,
    Info,
    Bell,
    CheckCircle2,
    Wifi,
    WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AlertsWidget() {
    const { data, isConnected, error, isAllowed } = useDashboardAlerts();

    if (!isAllowed) return null;

    if (!isConnected && !data) {
        return <AlertsSkeleton />;
    }

    if (!data && isConnected) {
        return (
            <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/10">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground/80">
                        <Wifi className="h-4 w-4 animate-pulse text-emerald-500" />
                        Live Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground animate-in fade-in duration-500">
                    <span className="relative flex h-8 w-8 mb-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                            <Bell className="h-4 w-4 text-emerald-600" />
                        </span>
                    </span>
                    <p className="text-sm">Connecting to secure alert stream...</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { summary, alerts } = data;
    const hasAlerts = alerts.length > 0;

    return (
        <Card className="overflow-hidden border-border/60 shadow-md bg-background/80 backdrop-blur-xl transition-all hover:shadow-lg">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
                            <div className="relative">
                                <Bell className="h-5 w-5 text-primary" />
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                            </div>
                            Live Operations Center
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">
                            Real-time system monitoring
                        </CardDescription>
                    </div>

                    {/* Summary Pills */}
                    <div className="flex gap-2">
                        {summary.critical > 0 && (
                            <div className="flex flex-col items-center justify-center px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
                                <span className="text-lg font-bold text-red-600 leading-none">{summary.critical}</span>
                                <span className="text-[10px] uppercase font-bold text-red-500/70 tracking-wider">Crit</span>
                            </div>
                        )}
                        {summary.urgent > 0 && (
                            <div className="flex flex-col items-center justify-center px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
                                <span className="text-lg font-bold text-orange-600 leading-none">{summary.urgent}</span>
                                <span className="text-[10px] uppercase font-bold text-orange-500/70 tracking-wider">Urg</span>
                            </div>
                        )}
                        {summary.warning > 0 && (
                            <div className="flex flex-col items-center justify-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                <span className="text-lg font-bold text-yellow-600 leading-none">{summary.warning}</span>
                                <span className="text-[10px] uppercase font-bold text-yellow-500/70 tracking-wider">Warn</span>
                            </div>
                        )}
                        <div className="ml-2 pl-2 border-l border-border/50 flex items-center">
                            {isConnected ? (
                                <Wifi className="h-4 w-4 text-emerald-500 opacity-80" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-destructive opacity-50" />
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {hasAlerts ? (
                    <ScrollArea className="h-[300px] w-full">
                        <div className="flex flex-col p-2 space-y-1">
                            {alerts.map((alert, index) => (
                                <AlertItem key={alert.id} alert={alert} index={index} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60 space-y-3">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/5 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground/80">All Systems Operational</p>
                            <p className="text-xs">No active alerts at this time.</p>
                        </div>
                    </div>
                )}
            </CardContent>
            {/* Footer / Status Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20" />
        </Card>
    );
}

function AlertItem({ alert, index }: { alert: Alert; index: number }) {
    const getStyles = () => {
        switch (alert.severity) {
            case "CRITICAL":
                return {
                    container: "bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-500",
                    iconRaw: <AlertOctagon className="h-5 w-5 text-red-600" />,
                    text: "text-red-900 dark:text-red-100",
                    badge: "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20"
                };
            case "URGENT":
                return {
                    container: "bg-orange-500/5 hover:bg-orange-500/10 border-l-4 border-l-orange-500",
                    iconRaw: <AlertTriangle className="h-5 w-5 text-orange-600" />,
                    text: "text-orange-900 dark:text-orange-100",
                    badge: "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/20"
                };
            case "WARNING":
                return {
                    container: "bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-l-yellow-500",
                    iconRaw: <AlertCircle className="h-5 w-5 text-yellow-600" />,
                    text: "text-yellow-900 dark:text-yellow-100",
                    badge: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20"
                };
            default:
                return {
                    container: "bg-blue-500/5 hover:bg-blue-500/10 border-l-4 border-l-blue-500",
                    iconRaw: <Info className="h-5 w-5 text-blue-600" />,
                    text: "text-blue-900 dark:text-blue-100",
                    badge: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20"
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={cn(
                "group relative flex gap-4 p-4 rounded-md transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in",
                styles.container,
                // index > 3 && "opacity-90" // Fade out older items slightly if list is long? Optional.
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-background/50 shadow-sm border border-border/50 self-start">
                {styles.iconRaw}
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-xs font-bold tracking-wide uppercase opacity-70", styles.text)}>
                        {alert.type.replace(/_/g, " ")}
                    </p>
                    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-bold tracking-tighter uppercase", styles.badge)}>
                        {alert.severity}
                    </Badge>
                </div>

                <p className="text-sm font-medium leading-relaxed text-foreground">
                    {alert.message}
                </p>

                {alert.metadata && (
                    <div className="pt-2 mt-1 border-t border-border/10 flex flex-wrap gap-2">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                            <div key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-background/40 border border-border/20 text-muted-foreground font-mono flex items-center gap-1.5 max-w-full truncate">
                                <span className="opacity-50 font-bold">{key}:</span>
                                <span className="opacity-90">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Highlight Glow Effect on Hover (using inset shadow or pseudo element if needed, simply handled by container hover state here) */}
        </div>
    );
}

function AlertsSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="flex gap-2">
                        <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-3 rounded border border-transparent">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
