"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchGlobalSettings,
    updateGlobalSettings,
    fetchOrgSettings,
    updateOrgSettings,
    fetchUserSettings,
    updateUserSettings,
    clearSettingsError
} from "@/store/slices/settingsSlice";
import { fetchOrganizations } from "@/store/slices/organizationSlice";
import { ProtectedPage } from "@/components/rbac/ProtectedPage";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Save, Globe, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { isSuperAdmin, isOrgAdmin } from "@/lib/rbac/helpers";
import type { UpdateGlobalSettingsInput, UpdateOrgSmtpSettingsInput, UpdateUserSettingsInput } from "@/lib/types";

export default function SettingsPage() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { globalSettings, orgSettings, userSettings, isLoading, error } = useAppSelector((state) => state.settings);
    const { organizations } = useAppSelector((state) => state.organizations);

    const userRole = user?.role;
    const canAccessGlobal = isSuperAdmin(userRole);
    const canAccessOrg = isSuperAdmin(userRole) || isOrgAdmin(userRole);

    // For org settings - which org to manage
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    // User preferences form state
    const [userForm, setUserForm] = useState<UpdateUserSettingsInput>({
        language: "",
        timezone: "",
    });

    // Global settings form state
    const [globalForm, setGlobalForm] = useState<UpdateGlobalSettingsInput>({
        language: "",
        timezone: "",
        maintenanceMode: false,
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: "",
        smtpPassword: "",
    });

    // Org settings form state
    const [orgForm, setOrgForm] = useState<UpdateOrgSmtpSettingsInput>({
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: "",
        smtpPassword: "",
        smtpFromEmail: "",
    });

    const orgList = Array.isArray(organizations) ? organizations : [];

    // Fetch user settings for all authenticated users
    useEffect(() => {
        dispatch(fetchUserSettings());
    }, [dispatch]);

    // Fetch organizations for super admin
    useEffect(() => {
        if (canAccessGlobal) {
            dispatch(fetchOrganizations());
        }
    }, [dispatch, canAccessGlobal]);

    // Fetch global settings
    useEffect(() => {
        if (canAccessGlobal) {
            dispatch(fetchGlobalSettings());
        }
    }, [dispatch, canAccessGlobal]);

    // Auto-select org for org admin
    useEffect(() => {
        if (isOrgAdmin(userRole) && user?.orgId && !selectedOrgId) {
            setSelectedOrgId(user.orgId);
        }
    }, [userRole, user?.orgId, selectedOrgId]);

    // Fetch org settings when org selected
    useEffect(() => {
        if (selectedOrgId) {
            dispatch(fetchOrgSettings(selectedOrgId));
        }
    }, [dispatch, selectedOrgId]);

    // Populate user form when settings load
    useEffect(() => {
        if (userSettings) {
            setUserForm({
                language: userSettings.language || "",
                timezone: userSettings.timezone || "",
            });
        }
    }, [userSettings]);

    // Populate global form when settings load
    useEffect(() => {
        if (globalSettings) {
            setGlobalForm({
                language: globalSettings.language || "",
                timezone: globalSettings.timezone || "",
                maintenanceMode: globalSettings.maintenanceMode || false,
                smtpHost: globalSettings.smtpHost || "",
                smtpPort: globalSettings.smtpPort || 587,
                smtpSecure: globalSettings.smtpSecure ?? true,
                smtpUser: "",
                smtpPassword: "",
            });
        }
    }, [globalSettings]);

    // Populate org form when settings load
    useEffect(() => {
        if (orgSettings) {
            setOrgForm({
                smtpHost: orgSettings.smtpHost || "",
                smtpPort: orgSettings.smtpPort || 587,
                smtpSecure: orgSettings.smtpSecure ?? true,
                smtpUser: orgSettings.smtpUser || "",
                smtpPassword: "",
                smtpFromEmail: orgSettings.smtpFromEmail || "",
            });
        }
    }, [orgSettings]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearSettingsError());
        }
    }, [error, dispatch]);

    // Helper to get only changed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getChangedFields = <T extends object>(
        original: T | null,
        current: T
    ): Partial<T> => {
        if (!original) return current;
        const changes: Partial<T> = {};
        for (const key of Object.keys(current) as (keyof T)[]) {
            const currentVal = current[key];
            const originalVal = original[key];
            // Only include if value changed and is not empty string for password fields
            if (currentVal !== originalVal && currentVal !== "" && currentVal !== undefined) {
                changes[key] = currentVal;
            }
        }
        return changes;
    };

    const handleSaveUserSettings = async () => {
        const changedFields = getChangedFields(userSettings, userForm);
        if (Object.keys(changedFields).length === 0) {
            toast.info("No changes to save");
            return;
        }
        const result = await dispatch(updateUserSettings(changedFields));
        if (updateUserSettings.fulfilled.match(result)) {
            toast.success("Preferences updated successfully");
        }
    };

    const handleSaveGlobalSettings = async () => {
        const changedFields = getChangedFields(
            globalSettings ? {
                language: globalSettings.language,
                timezone: globalSettings.timezone,
                maintenanceMode: globalSettings.maintenanceMode,
                smtpHost: globalSettings.smtpHost || "",
                smtpPort: globalSettings.smtpPort || 587,
                smtpSecure: globalSettings.smtpSecure ?? true,
                smtpUser: "",
                smtpPassword: "",
            } : null,
            globalForm
        );
        if (Object.keys(changedFields).length === 0) {
            toast.info("No changes to save");
            return;
        }
        const result = await dispatch(updateGlobalSettings(changedFields));
        if (updateGlobalSettings.fulfilled.match(result)) {
            toast.success("Global settings updated successfully");
        }
    };

    const handleSaveOrgSettings = async () => {
        if (!selectedOrgId) return;
        const changedFields = getChangedFields(
            orgSettings ? {
                smtpHost: orgSettings.smtpHost || "",
                smtpPort: orgSettings.smtpPort || 587,
                smtpSecure: orgSettings.smtpSecure ?? true,
                smtpUser: orgSettings.smtpUser || "",
                smtpPassword: "",
                smtpFromEmail: orgSettings.smtpFromEmail || "",
            } : null,
            orgForm
        );
        if (Object.keys(changedFields).length === 0) {
            toast.info("No changes to save");
            return;
        }
        const result = await dispatch(updateOrgSettings({ orgId: selectedOrgId, data: changedFields }));
        if (updateOrgSettings.fulfilled.match(result)) {
            toast.success("Organization settings updated successfully");
        }
    };

    // Default to user preferences tab (available for all users)
    const defaultTab = "preferences";

    return (
        <ProtectedPage module="SETTINGS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Settings
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your preferences and system settings
                        </p>
                    </div>
                </div>

                <Tabs defaultValue={defaultTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="preferences" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            My Preferences
                        </TabsTrigger>
                        {canAccessGlobal && (
                            <TabsTrigger value="global" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Global Settings
                            </TabsTrigger>
                        )}
                        {canAccessOrg && (
                            <TabsTrigger value="organization" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Organization Settings
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* User Preferences Tab */}
                    <TabsContent value="preferences" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Preferences</CardTitle>
                                <CardDescription>
                                    Customize your personal settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userLanguage">Language</Label>
                                        <Select
                                            value={userForm.language}
                                            onValueChange={(value) => setUserForm({ ...userForm, language: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                                <SelectItem value="de">German</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userTimezone">Timezone</Label>
                                        <Select
                                            value={userForm.timezone}
                                            onValueChange={(value) => setUserForm({ ...userForm, timezone: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                                                <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveUserSettings} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Preferences
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Global Settings Tab */}
                    {canAccessGlobal && (
                        <TabsContent value="global" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Settings</CardTitle>
                                    <CardDescription>
                                        Configure global system settings (Super Admin only)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="language">Default Language</Label>
                                            <Select
                                                value={globalForm.language}
                                                onValueChange={(value) => setGlobalForm({ ...globalForm, language: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="es">Spanish</SelectItem>
                                                    <SelectItem value="fr">French</SelectItem>
                                                    <SelectItem value="de">German</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Default Timezone</Label>
                                            <Select
                                                value={globalForm.timezone}
                                                onValueChange={(value) => setGlobalForm({ ...globalForm, timezone: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                    <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                                                    <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="maintenanceMode"
                                            checked={globalForm.maintenanceMode}
                                            onCheckedChange={(checked: boolean) => setGlobalForm({ ...globalForm, maintenanceMode: checked })}
                                        />
                                        <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Global SMTP Settings</CardTitle>
                                    <CardDescription>
                                        Configure system-wide email settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpHost">SMTP Host</Label>
                                            <Input
                                                id="smtpHost"
                                                value={globalForm.smtpHost}
                                                onChange={(e) => setGlobalForm({ ...globalForm, smtpHost: e.target.value })}
                                                placeholder="smtp.example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPort">SMTP Port</Label>
                                            <Input
                                                id="smtpPort"
                                                type="number"
                                                value={globalForm.smtpPort}
                                                onChange={(e) => setGlobalForm({ ...globalForm, smtpPort: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpUser">SMTP User</Label>
                                            <Input
                                                id="smtpUser"
                                                value={globalForm.smtpUser}
                                                onChange={(e) => setGlobalForm({ ...globalForm, smtpUser: e.target.value })}
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPassword">SMTP Password</Label>
                                            <Input
                                                id="smtpPassword"
                                                type="password"
                                                value={globalForm.smtpPassword}
                                                onChange={(e) => setGlobalForm({ ...globalForm, smtpPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="smtpSecure"
                                            checked={globalForm.smtpSecure}
                                            onCheckedChange={(checked: boolean) => setGlobalForm({ ...globalForm, smtpSecure: checked })}
                                        />
                                        <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveGlobalSettings} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save Global Settings
                                </Button>
                            </div>
                        </TabsContent>
                    )}

                    {/* Organization Settings Tab */}
                    {canAccessOrg && (
                        <TabsContent value="organization" className="space-y-6">
                            {canAccessGlobal && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Select Organization</CardTitle>
                                        <CardDescription>
                                            Choose an organization to manage its settings
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                            <SelectTrigger className="w-full md:w-80">
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
                                    </CardContent>
                                </Card>
                            )}

                            {selectedOrgId && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Organization SMTP Settings</CardTitle>
                                            <CardDescription>
                                                Configure email settings for this organization
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="orgSmtpHost">SMTP Host</Label>
                                                    <Input
                                                        id="orgSmtpHost"
                                                        value={orgForm.smtpHost}
                                                        onChange={(e) => setOrgForm({ ...orgForm, smtpHost: e.target.value })}
                                                        placeholder="smtp.organization.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="orgSmtpPort">SMTP Port</Label>
                                                    <Input
                                                        id="orgSmtpPort"
                                                        type="number"
                                                        value={orgForm.smtpPort}
                                                        onChange={(e) => setOrgForm({ ...orgForm, smtpPort: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="orgSmtpUser">SMTP User</Label>
                                                    <Input
                                                        id="orgSmtpUser"
                                                        value={orgForm.smtpUser}
                                                        onChange={(e) => setOrgForm({ ...orgForm, smtpUser: e.target.value })}
                                                        placeholder="user@organization.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="orgSmtpPassword">SMTP Password</Label>
                                                    <Input
                                                        id="orgSmtpPassword"
                                                        type="password"
                                                        value={orgForm.smtpPassword}
                                                        onChange={(e) => setOrgForm({ ...orgForm, smtpPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="smtpFromEmail">From Email Address</Label>
                                                    <Input
                                                        id="smtpFromEmail"
                                                        value={orgForm.smtpFromEmail}
                                                        onChange={(e) => setOrgForm({ ...orgForm, smtpFromEmail: e.target.value })}
                                                        placeholder="noreply@organization.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="orgSmtpSecure"
                                                    checked={orgForm.smtpSecure}
                                                    onCheckedChange={(checked: boolean) => setOrgForm({ ...orgForm, smtpSecure: checked })}
                                                />
                                                <Label htmlFor="orgSmtpSecure">Use TLS/SSL</Label>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveOrgSettings} disabled={isLoading}>
                                            {isLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Save Organization Settings
                                        </Button>
                                    </div>
                                </>
                            )}

                            {!selectedOrgId && (
                                <Card>
                                    <CardContent className="py-10 text-center text-muted-foreground">
                                        Select an organization to manage its settings
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ProtectedPage>
    );
}
