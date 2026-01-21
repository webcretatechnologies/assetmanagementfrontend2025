import type { User, UserRole } from "@/lib/types";

export interface ConversationUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    branchId?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
}

export interface Conversation {
    user: ConversationUser;
    lastMessage: {
        content: string;
        sentAt: string;
        isRead: boolean;
    };
    unreadCount?: number;
}

export interface HistoryMessage {
    id: string;
    organizationId: string;
    branchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    sentAt: string;
}

/**
 * Get list of users with active conversations.
 * This endpoint ignores branch filters - it returns all users you've exchanged messages with.
 * Uses the backend API directly (not the Next.js proxy).
 */
export async function getConversations(token: string): Promise<Conversation[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${baseUrl}/messages/conversations`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch conversations");
    }

    return res.json();
}

/**
 * Fetch chat history between current user and another user.
 */
export async function getMessageHistory(token: string, otherUserId: string): Promise<HistoryMessage[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${baseUrl}/messages/history?otherUserId=${otherUserId}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch message history");
    }

    return res.json();
}
