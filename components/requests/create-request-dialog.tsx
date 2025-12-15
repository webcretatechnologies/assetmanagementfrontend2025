"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createRequest } from "@/store/slices/requestSlice";
import { fetchUserAssignments } from "@/store/slices/assignmentSlice";
import type { CreateRequestInput, RequestType, RequestUrgency } from "@/lib/types";

interface CreateRequestDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    organizationId: string;
    userId: string;
}

const requestTypes: { value: RequestType; label: string }[] = [
    { value: "RETURN", label: "Return Asset" },
    { value: "REPAIR", label: "Request Repair" },
];

const urgencies: { value: RequestUrgency; label: string }[] = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

export function CreateRequestDialog({
    trigger,
    onSuccess,
    organizationId,
    userId,
}: CreateRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
    const [selectedType, setSelectedType] = useState<RequestType>("RETURN");
    const [selectedUrgency, setSelectedUrgency] = useState<RequestUrgency>("MEDIUM");

    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.requests);
    const { userAssignments } = useAppSelector((state) => state.assignments);

    useEffect(() => {
        if (open && organizationId && userId) {
            dispatch(fetchUserAssignments({ userId, organizationId }));
        }
    }, [open, organizationId, userId, dispatch]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ reason: string; description: string }>({
        defaultValues: { reason: "", description: "" },
    });

    const onSubmit = async (data: { reason: string; description: string }) => {
        if (!selectedAssignmentId) return;

        const payload: CreateRequestInput = {
            assignmentId: selectedAssignmentId,
            requestType: selectedType,
            reason: data.reason,
            description: data.description || undefined,
            urgency: selectedUrgency,
        };

        const result = await dispatch(createRequest(payload));
        if (createRequest.fulfilled.match(result)) {
            reset();
            setSelectedAssignmentId("");
            setSelectedType("RETURN");
            setSelectedUrgency("MEDIUM");
            setOpen(false);
            onSuccess?.();
        }
    };

    const activeAssignments = userAssignments.filter((a) => a.status === "ACTIVE");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Create Request</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Request</DialogTitle>
                    <DialogDescription>
                        Request to return or repair an assigned asset.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {/* Assignment */}
                        <div className="space-y-2">
                            <Label>Select Asset *</Label>
                            <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an assigned asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeAssignments.map((assignment) => (
                                        <SelectItem key={assignment.id} value={assignment.id}>
                                            {assignment.product?.name} ({assignment.product?.sku})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {activeAssignments.length === 0 && (
                                <p className="text-xs text-muted-foreground">No active assignments</p>
                            )}
                        </div>

                        {/* Request Type */}
                        <div className="space-y-2">
                            <Label>Request Type *</Label>
                            <Select
                                value={selectedType}
                                onValueChange={(v) => setSelectedType(v as RequestType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {requestTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Urgency */}
                        <div className="space-y-2">
                            <Label>Urgency</Label>
                            <Select
                                value={selectedUrgency}
                                onValueChange={(v) => setSelectedUrgency(v as RequestUrgency)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {urgencies.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>
                                            {u.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason * (min 10 chars)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Explain why you need to return or repair this asset..."
                                rows={3}
                                {...register("reason", {
                                    required: "Reason is required",
                                    minLength: { value: 10, message: "Reason must be at least 10 characters" },
                                })}
                            />
                            {errors.reason && (
                                <p className="text-xs text-destructive">{errors.reason.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Additional Details</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide more details if needed..."
                                rows={2}
                                {...register("description")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !selectedAssignmentId}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Request"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
