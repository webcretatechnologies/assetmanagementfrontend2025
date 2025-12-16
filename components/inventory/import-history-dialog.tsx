"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Undo2, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchRecentImportsThunk, undoImportThunk, fetchInventory } from "@/store/slices/inventorySlice";
import type { ImportStatus } from "@/lib/types";
import { toast } from "sonner";

interface ImportHistoryDialogProps {
    trigger?: React.ReactNode;
    organizationId: string;
    onRefresh?: () => void;
}

const getStatusBadge = (status: ImportStatus) => {
    switch (status) {
        case "COMPLETED":
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                </Badge>
            );
        case "FAILED":
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    <XCircle className="mr-1 h-3 w-3" />
                    Failed
                </Badge>
            );
        case "REVERTED":
            return (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                    <Undo2 className="mr-1 h-3 w-3" />
                    Reverted
                </Badge>
            );
        case "PROCESSING":
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Processing
                </Badge>
            );
        case "PENDING":
        default:
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                </Badge>
            );
    }
};

export function ImportHistoryDialog({
    trigger,
    organizationId,
    onRefresh,
}: ImportHistoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [undoConfirmId, setUndoConfirmId] = useState<string | null>(null);

    const dispatch = useAppDispatch();
    const { recentImports, isLoadingHistory, isUndoing } = useAppSelector(
        (state) => state.inventory
    );

    useEffect(() => {
        if (open && organizationId) {
            dispatch(fetchRecentImportsThunk(organizationId));
        }
    }, [open, organizationId, dispatch]);

    const handleUndo = async (importId: string) => {
        const result = await dispatch(
            undoImportThunk({ importId, organizationId })
        );

        if (undoImportThunk.fulfilled.match(result)) {
            toast.success("Import reverted successfully");
            // Refresh the imports list
            dispatch(fetchRecentImportsThunk(organizationId));
            // Refresh inventory
            dispatch(
                fetchInventory({
                    organizationId,
                    page: 1,
                    limit: 10,
                })
            );
            onRefresh?.();
        }
        setUndoConfirmId(null);
    };

    const importsList = Array.isArray(recentImports) ? recentImports : [];

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm">
                            <History className="mr-2 h-4 w-4" />
                            Import History
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Recent Imports</DialogTitle>
                        <DialogDescription>
                            View and manage recent inventory import batches. Undo an import to revert all items added in that batch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : importsList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No recent imports found</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg max-h-96 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Filename</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {importsList.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {record.filename}
                                                </TableCell>
                                                <TableCell>{record.transactions}</TableCell>
                                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(record.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {record.status === "COMPLETED" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setUndoConfirmId(record.id)}
                                                            disabled={isUndoing}
                                                        >
                                                            <Undo2 className="mr-1 h-4 w-4" />
                                                            Undo
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>
                                    Undo will fail if items from the batch have been sold, moved, or their quantity has been reduced.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!undoConfirmId} onOpenChange={() => setUndoConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Undo Import</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will revert all inventory items added in this import batch. This action cannot be undone.
                            Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUndoing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => undoConfirmId && handleUndo(undoConfirmId)}
                            disabled={isUndoing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isUndoing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reverting...
                                </>
                            ) : (
                                <>
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Undo Import
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
