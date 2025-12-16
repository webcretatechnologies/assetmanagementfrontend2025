"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { importInventoryThunk, clearImportResult, fetchInventory } from "@/store/slices/inventorySlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { fetchBranchesByOrg } from "@/store/slices/branchSlice";
import { isSuperAdmin } from "@/lib/rbac";

interface ImportInventoryDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    defaultOrgId?: string;
    defaultBranchId?: string;
}

export function ImportInventoryDialog({
    trigger,
    onSuccess,
    defaultOrgId,
    defaultBranchId,
}: ImportInventoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId || "");
    const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dispatch = useAppDispatch();
    const { isImporting, importResult, importError } = useAppSelector((state) => state.inventory);
    const { organizations } = useAppSelector((state) => state.organizations);
    const { branches } = useAppSelector((state) => state.branches);
    const { user } = useAppSelector((state) => state.auth);

    const orgList = Array.isArray(organizations) ? organizations : [];
    const branchList = Array.isArray(branches) ? branches : [];

    const userRole = user?.role;
    const canSelectOrg = isSuperAdmin(userRole);

    useEffect(() => {
        if (open) {
            if (orgList.length === 0) {
                dispatch(fetchOrganizations());
            }
            if (defaultOrgId) {
                setSelectedOrgId(defaultOrgId);
            }
            if (defaultBranchId) {
                setSelectedBranchId(defaultBranchId);
            }
        }
    }, [open, orgList.length, dispatch, defaultOrgId, defaultBranchId]);

    useEffect(() => {
        if (selectedOrgId) {
            dispatch(fetchBranchesByOrg(selectedOrgId));
        }
    }, [selectedOrgId, dispatch]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleImport = async () => {
        if (!selectedFile || !selectedOrgId) return;

        const result = await dispatch(
            importInventoryThunk({
                file: selectedFile,
                organizationId: selectedOrgId,
                branchId: selectedBranchId || undefined,
            })
        );

        if (importInventoryThunk.fulfilled.match(result)) {
            // Refresh inventory list
            dispatch(
                fetchInventory({
                    organizationId: selectedOrgId,
                    branchId: selectedBranchId || undefined,
                    page: 1,
                    limit: 10,
                })
            );
            onSuccess?.();
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedFile(null);
        dispatch(clearImportResult());
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const activeBranches = branchList.filter((b) => b.status === "ACTIVE");

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Inventory</DialogTitle>
                    <DialogDescription>
                        Bulk import inventory from a CSV or Excel file.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Organization */}
                    {canSelectOrg && (
                        <div className="space-y-2">
                            <Label>Organization *</Label>
                            <Select
                                value={selectedOrgId}
                                onValueChange={setSelectedOrgId}
                                disabled={!!defaultOrgId || isImporting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgList.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Branch (optional) */}
                    <div className="space-y-2">
                        <Label>Branch (optional - applies to all rows if set)</Label>
                        <Select
                            value={selectedBranchId || "all"}
                            onValueChange={(value) => setSelectedBranchId(value === "all" ? "" : value)}
                            disabled={!selectedOrgId || isImporting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {activeBranches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>File *</Label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={isImporting}
                                className="hidden"
                                id="import-file"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="flex-1"
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                {selectedFile ? selectedFile.name : "Choose CSV or Excel file"}
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Supported formats:</strong> CSV, XLSX, XLS</p>
                            <p><strong>Required:</strong> SKU, Quantity</p>
                            <p><strong>Optional:</strong> SerialNumber, Barcode, Status, PurchaseDate, RequiresService, ServiceFrequency, etc.</p>
                            <p className="text-muted-foreground/70">
                                💡 For bulk serialized items, separate serial numbers with commas: &quot;SN1, SN2, SN3&quot;
                            </p>
                        </div>
                    </div>

                    {/* Import Results */}
                    {importResult && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">{importResult.successCount} imported</span>
                                </div>
                                {importResult.errorCount > 0 && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="h-5 w-5" />
                                        <span className="font-medium">{importResult.errorCount} errors</span>
                                    </div>
                                )}
                            </div>

                            {importResult.errors.length > 0 && (
                                <div className="border rounded-lg max-h-48 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Row</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importResult.errors.map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono">{err.row}</TableCell>
                                                    <TableCell className="font-mono">{err.sku}</TableCell>
                                                    <TableCell className="text-red-600">{err.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import Error */}
                    {importError && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>{importError}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        {importResult ? "Close" : "Cancel"}
                    </Button>
                    {!importResult && (
                        <Button
                            type="button"
                            onClick={handleImport}
                            disabled={isImporting || !selectedOrgId || !selectedFile}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
