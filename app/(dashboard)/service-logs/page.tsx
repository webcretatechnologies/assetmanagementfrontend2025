"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Wrench, Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchServiceLogs,
    deleteServiceLog,
} from "@/store/slices/serviceLogSlice";
import { AddServiceLogDialog } from "@/components/service-logs/add-service-log-dialog";
import { EditServiceLogDialog } from "@/components/service-logs/edit-service-log-dialog";
import { ProtectedPage, PermissionGate } from "@/components/rbac";
import { canUpdate, canDelete } from "@/lib/rbac";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { ServiceLog, ServiceLogStatus } from "@/lib/types";

const getStatusColor = (status: ServiceLogStatus) => {
    switch (status) {
        case "COMPLETED":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "IN_PROGRESS":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "SCHEDULED":
            return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        case "CANCELLED":
            return "bg-red-500/10 text-red-500 border-red-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function ServiceLogsPage() {
    const dispatch = useAppDispatch();
    const { serviceLogs, isLoading, meta } = useAppSelector((state) => state.serviceLogs);
    const { user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [editingLog, setEditingLog] = useState<ServiceLog | null>(null);
    const [deletingLog, setDeletingLog] = useState<ServiceLog | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const userRole = user?.role;

    const refreshServiceLogs = useCallback(() => {
        dispatch(fetchServiceLogs({
            page: currentPage,
            limit: pageSize,
            status: statusFilter !== "all" ? statusFilter as ServiceLogStatus : undefined,
        }));
    }, [dispatch, currentPage, pageSize, statusFilter]);

    // Fetch service logs with pagination and filters
    useEffect(() => {
        if (user) {
            refreshServiceLogs();
        }
    }, [user, refreshServiceLogs]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleDelete = async () => {
        if (deletingLog) {
            await dispatch(deleteServiceLog(deletingLog.id));
            refreshServiceLogs();
            setDeletingLog(null);
        }
    };

    const logList = Array.isArray(serviceLogs) ? serviceLogs : [];

    // Client-side search filtering (since backend may not support search)
    const filteredLogs = searchTerm
        ? logList.filter(log =>
            log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : logList;

    return (
        <ProtectedPage module="SERVICE_LOGS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Service Logs
                        </h1>
                        <p className="text-muted-foreground">
                            Track maintenance and repair services
                        </p>
                    </div>
                    <PermissionGate module="SERVICE_LOGS" action="CREATE">
                        <AddServiceLogDialog
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Log Service
                                </Button>
                            }
                            onSuccess={refreshServiceLogs}
                        />
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>All Service Logs</CardTitle>
                                <CardDescription>
                                    {(meta?.total ?? 0) > 0
                                        ? `Showing ${filteredLogs.length} of ${meta?.total ?? 0} service logs`
                                        : "A history of all maintenance and repair services"}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={5} columns={6} />
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No service logs found</p>
                                <p className="text-sm text-muted-foreground">
                                    Log your first service to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Vendor</TableHead>
                                                <TableHead className="hidden md:table-cell">Technician</TableHead>
                                                <TableHead className="hidden lg:table-cell">Date</TableHead>
                                                <TableHead className="hidden md:table-cell">Cost</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{log.title}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {log.serviceType}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.vendor?.name || "Unknown"}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {log.performedBy}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {formatDate(log.completedAt || log.scheduledDate)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                            {formatCurrency(log.totalCost || ((log.laborCost || 0) + (log.partsCost || 0)))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                                log.status
                                                            )}`}
                                                        >
                                                            {log.status.replace("_", " ")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {canUpdate(userRole, "SERVICE_LOGS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setEditingLog(log)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete(userRole, "SERVICE_LOGS") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingLog(log)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        {(meta?.total ?? 0) === 0
                                            ? "No service logs found"
                                            : `Page ${currentPage} of ${meta?.totalPages ?? 1}`}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage <= 1 || isLoading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            disabled={isLoading || (meta?.totalPages ?? 1) <= 1 || currentPage >= (meta?.totalPages ?? 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {editingLog && (
                    <EditServiceLogDialog
                        serviceLog={editingLog}
                        open={!!editingLog}
                        onOpenChange={(open) => !open && setEditingLog(null)}
                        onSuccess={refreshServiceLogs}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={!!deletingLog}
                    onOpenChange={(open) => !open && setDeletingLog(null)}
                    title="Delete Service Log"
                    description={`Are you sure you want to delete the service log "${deletingLog?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                />
            </div>
        </ProtectedPage>
    );
}
