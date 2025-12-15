import { apiClient } from "./client";
import type {
    GlobalSettings,
    UpdateGlobalSettingsInput,
    OrgSmtpSettings,
    UpdateOrgSmtpSettingsInput,
    UserSettings,
    UpdateUserSettingsInput,
    PublicConfig,
} from "@/lib/types";

const api = apiClient;

// Public Config (no auth required) - for login screen, etc.
export async function getPublicConfig(): Promise<PublicConfig> {
    const res = await api.get<PublicConfig>("/settings/config");
    return res.data;
}

// User Profile Settings (any authenticated user)
export async function getUserSettings(): Promise<UserSettings> {
    const res = await api.get<UserSettings>("/settings/profile");
    return res.data;
}

export async function updateUserSettings(
    data: UpdateUserSettingsInput
): Promise<UserSettings> {
    const res = await api.patch<UserSettings>("/settings/profile", data);
    return res.data;
}

// Global Settings (SUPER_ADMIN only)
export async function getGlobalSettings(): Promise<GlobalSettings> {
    const res = await api.get<GlobalSettings>("/settings/global");
    return res.data;
}

export async function updateGlobalSettings(
    data: UpdateGlobalSettingsInput
): Promise<GlobalSettings> {
    const res = await api.patch<GlobalSettings>("/settings/global", data);
    return res.data;
}

// Organization SMTP Settings
export async function getOrgSettings(orgId: string): Promise<OrgSmtpSettings> {
    const res = await api.get<OrgSmtpSettings>(`/settings/org/${orgId}`);
    return res.data;
}

export async function updateOrgSettings(
    orgId: string,
    data: UpdateOrgSmtpSettingsInput
): Promise<OrgSmtpSettings> {
    const res = await api.patch<OrgSmtpSettings>(`/settings/org/${orgId}`, data);
    return res.data;
}
