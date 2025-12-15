"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { User as UserIcon, Mail, Shield, Calendar, Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateProfile } from "@/lib/api/users";
import { setUser } from "@/store/slices/authSlice";

// Role display names mapping
const ROLE_DISPLAY_NAMES: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ORG_ADMIN: "Org Admin",
    BRANCH_MANAGER: "Branch Manager",
    INVENTORY_OPERATOR: "Inventory Operator",
    SERVICE_TECHNICIAN: "Service Technician",
    EMPLOYEE: "Employee",
};

function formatRole(role?: string): string {
    if (!role) return "User";
    return ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, " ");
}

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // UI state
    const [mounted, setMounted] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Hydration fix - delay rendering user data until client-side
    useEffect(() => {
        setMounted(true);
    }, []);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
        }
    }, [user]);

    const getInitials = (firstName?: string, lastName?: string, email?: string) => {
        if (!mounted) return "U"; // Consistent SSR fallback
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        if (firstName) {
            return firstName.slice(0, 2).toUpperCase();
        }
        if (email) {
            return email.slice(0, 2).toUpperCase();
        }
        return "U";
    };

    const handleSaveChanges = async () => {
        // Validation
        if (!firstName.trim()) {
            toast.error("First name is required");
            return;
        }

        // Password validation
        if (currentPassword || newPassword) {
            if (!currentPassword) {
                toast.error("Current password is required to change password");
                return;
            }
            if (!newPassword) {
                toast.error("New password is required");
                return;
            }
            if (currentPassword === newPassword) {
                toast.error("New password must be different from current password");
                return;
            }
            if (newPassword.length < 6) {
                toast.error("New password must be at least 6 characters");
                return;
            }
        }

        setIsLoading(true);
        try {
            const updateData: { firstName: string; lastName: string; currentPassword?: string; newPassword?: string } = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            };

            // Only include password fields if changing password
            if (currentPassword && newPassword) {
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }

            const updatedUser = await updateProfile(updateData);

            // Update the user in Redux store
            dispatch(setUser(updatedUser));

            // Clear password fields
            setCurrentPassword("");
            setNewPassword("");

            toast.success("Profile updated successfully");
        } catch {
            // Error toast is already shown by the API client interceptor
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form to user data
        setFirstName(user?.firstName || "");
        setLastName(user?.lastName || "");
        setCurrentPassword("");
        setNewPassword("");
    };

    const formatJoinDate = (dateString?: string) => {
        if (!dateString) return "Unknown";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } catch {
            return "Unknown";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    Profile
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <Card className="lg:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                                    <AvatarImage src="" alt={user?.email || "User"} />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-medium">
                                        {getInitials(user?.firstName, user?.lastName, user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold">
                                {mounted
                                    ? (user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.firstName || user?.email?.split("@")[0] || "User")
                                    : "User"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {mounted ? user?.email : ""}
                            </p>
                            <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {mounted ? formatRole(user?.role) : "User"}
                            </span>
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium ml-auto">{mounted ? user?.email : ""}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Role:</span>
                                <span className="font-medium ml-auto">{mounted ? formatRole(user?.role) : "User"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Joined:</span>
                                <span className="font-medium ml-auto">{mounted ? formatJoinDate((user as { createdAt?: string })?.createdAt) : ""}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Enter your first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Enter your last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-medium mb-4">Change Password</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Leave blank if you don&apos;t want to change your password
                            </p>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pr-10"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pr-10"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveChanges} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
