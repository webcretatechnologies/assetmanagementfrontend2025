"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquarePlus, MessagesSquare, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessaging } from "@/lib/contexts/messaging-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsersByOrg } from "@/store/slices/userSlice";
import { User, UserRole } from "@/lib/types";
import { getConversations, Conversation } from "@/lib/api/messages";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Role Logic
// EMPLOYEE -> SERVICE_TECHNICIAN, INVENTORY_OPERATOR
// SERVICE_TECHNICIAN -> INVENTORY_OPERATOR, BRANCH_MANAGER
// INVENTORY_OPERATOR -> All Roles (within branch)
// BRANCH_MANAGER -> All Roles (within branch)
// ORG_ADMIN -> All Roles (global)
// SUPER_ADMIN -> All Roles (global)

const canMessage = (senderRole: UserRole, receiverRole: UserRole): boolean => {
    switch (senderRole) {
        case "EMPLOYEE":
            return ["SERVICE_TECHNICIAN", "INVENTORY_OPERATOR"].includes(receiverRole);
        case "SERVICE_TECHNICIAN":
            return ["INVENTORY_OPERATOR", "BRANCH_MANAGER"].includes(receiverRole);
        case "INVENTORY_OPERATOR":
        case "BRANCH_MANAGER":
            return true;
        case "ORG_ADMIN":
        case "SUPER_ADMIN":
            return true;
        default:
            return false;
    }
};

type TabType = "conversations" | "new";

export function UserList() {
    const dispatch = useAppDispatch();
    const { user: currentUser, access_token } = useAppSelector((state) => state.auth);
    const { users } = useAppSelector((state) => state.users);
    const { setActiveChatUser, unreadCounts, messages, onlineUsers, setOnlineUsers } = useMessaging();

    const [activeTab, setActiveTab] = useState<TabType>("conversations");
    const [search, setSearch] = useState("");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [conversationsError, setConversationsError] = useState<string | null>(null);

    // Fetch conversations
    useEffect(() => {
        const loadConversations = async () => {
            if (!access_token) return;
            setConversationsLoading(true);
            setConversationsError(null);
            try {
                const data = await getConversations(access_token);
                console.log("Conversations API response:", data);
                // API returns { partner: {...}, lastMessage: {...} }
                // Map 'partner' to 'user' for our Conversation interface
                const mappedData: Conversation[] = Array.isArray(data) ? data.map((item: any) => ({
                    user: {
                        id: item.partner?.id || "",
                        firstName: item.partner?.firstName || "Unknown",
                        lastName: item.partner?.lastName || "",
                        email: item.partner?.email || "",
                        role: item.partner?.role || "EMPLOYEE",
                        branchId: item.partner?.branchId,
                        isOnline: item.partner?.isOnline || false,
                        lastSeenAt: item.partner?.lastSeenAt
                    },
                    lastMessage: {
                        content: item.lastMessage?.content || "No messages",
                        sentAt: item.lastMessage?.sentAt || new Date().toISOString(),
                        isRead: item.lastMessage?.isRead ?? true
                    },
                    unreadCount: item.unreadCount || 0
                })) : [];
                setConversations(mappedData);

                // Populate initial online users from API response
                const initialOnlineUsers = mappedData
                    .filter((c) => c.user.isOnline)
                    .map((c) => c.user.id);
                if (initialOnlineUsers.length > 0) {
                    setOnlineUsers((prev) => {
                        const combined = new Set([...prev, ...initialOnlineUsers]);
                        return Array.from(combined);
                    });
                }
            } catch (err: any) {
                console.error("Failed to fetch conversations:", err);
                setConversationsError("Failed to load conversations");
            } finally {
                setConversationsLoading(false);
            }
        };
        loadConversations();
    }, [access_token, setOnlineUsers]);

    // Update conversations when new messages arrive
    useEffect(() => {
        if (messages.length === 0 || !currentUser) return;

        // Get the latest message
        const latestMessage = messages[messages.length - 1];
        if (!latestMessage) return;

        // Determine the partner ID (the other user in the conversation)
        const partnerId = latestMessage.senderId === currentUser.id
            ? latestMessage.receiverId
            : latestMessage.senderId;

        setConversations(prevConversations => {
            // Check if this conversation already exists
            const existingIndex = prevConversations.findIndex(c => c.user.id === partnerId);

            if (existingIndex >= 0) {
                // Update existing conversation with latest message
                const updated = [...prevConversations];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    lastMessage: {
                        content: latestMessage.content,
                        sentAt: latestMessage.sentAt,
                        isRead: latestMessage.isRead
                    }
                };
                // Move to top (most recent first)
                const [movedItem] = updated.splice(existingIndex, 1);
                return [movedItem, ...updated];
            } else {
                // New conversation - add to top with sender info
                const senderInfo = latestMessage.sender;
                if (senderInfo && latestMessage.senderId !== currentUser.id) {
                    return [{
                        user: {
                            id: senderInfo.id,
                            firstName: senderInfo.firstName,
                            lastName: senderInfo.lastName,
                            email: senderInfo.email || "",
                            role: senderInfo.role,
                            branchId: undefined
                        },
                        lastMessage: {
                            content: latestMessage.content,
                            sentAt: latestMessage.sentAt,
                            isRead: latestMessage.isRead
                        },
                        unreadCount: 1
                    }, ...prevConversations];
                }
            }
            return prevConversations;
        });
    }, [messages, currentUser]);

    // Fetch users for "New Chat" tab
    useEffect(() => {
        if (currentUser?.orgId && activeTab === "new") {
            dispatch(fetchUsersByOrg({ orgId: currentUser.orgId, limit: 100 }));
        }
    }, [dispatch, currentUser, activeTab]);

    if (!currentUser) return null;

    // Filter users for "New Chat" tab (existing logic)
    const filteredUsers = users.filter((u) => {
        if (u.id === currentUser.id) return false;

        // Search
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        if (search && !name.includes(search.toLowerCase())) return false;

        // Branch Check (Except Admins)
        const amIAdmin = ["ORG_ADMIN", "SUPER_ADMIN"].includes(currentUser.role as string);
        const isTargetAdmin = ["ORG_ADMIN", "SUPER_ADMIN"].includes(u.role);

        if (!amIAdmin) {
            if (u.branchId !== currentUser.branchId && !isTargetAdmin) {
                return false;
            }
        }

        // Role Check
        return canMessage(currentUser.role as UserRole, u.role);
    });

    // Filter conversations by search
    const filteredConversations = conversations.filter((c) => {
        if (!search) return true;
        const name = `${c.user.firstName} ${c.user.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const handleSelectConversation = (conv: Conversation) => {
        // Map conversation user to User type
        const user: User = {
            id: conv.user.id,
            firstName: conv.user.firstName,
            lastName: conv.user.lastName,
            email: conv.user.email,
            role: conv.user.role,
            branchId: conv.user.branchId,
            orgId: currentUser.orgId || "",
            status: "ACTIVE",
            createdAt: "",
            updatedAt: ""
        };
        setActiveChatUser(user);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b space-y-3">
                {/* Tab Switcher */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <Button
                        variant={activeTab === "conversations" ? "secondary" : "ghost"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setActiveTab("conversations")}
                    >
                        <MessagesSquare className="h-4 w-4" />
                        Chats
                    </Button>
                    {/* Hide "New" tab for employees - they can only reply to existing chats */}
                    {currentUser.role !== "EMPLOYEE" && (
                        <Button
                            variant={activeTab === "new" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => setActiveTab("new")}
                        >
                            <MessageSquarePlus className="h-4 w-4" />
                            New
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={activeTab === "conversations" ? "Search conversations..." : "Search users..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === "conversations" ? (
                    // Conversations Tab
                    conversationsLoading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : conversationsError ? (
                        <div className="p-4 text-center text-destructive text-sm">
                            {conversationsError}
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No conversations yet. Start a new chat!
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredConversations.map((conv, index) => (
                                <button
                                    key={conv.user?.id || `conv-${index}`}
                                    onClick={() => handleSelectConversation(conv)}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {conv.user?.firstName?.[0] || "?"}
                                                {conv.user?.lastName?.[0] || ""}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Only show green indicator when online */}
                                        {conv.user?.id && onlineUsers.includes(conv.user.id) && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium truncate">
                                                {conv.user?.firstName || "Unknown"} {conv.user?.lastName || "User"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {conv.lastMessage?.sentAt ? formatDistanceToNow(new Date(conv.lastMessage.sentAt), { addSuffix: true }) : ""}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-muted-foreground truncate flex-1">
                                                {conv.lastMessage?.content || "No messages"}
                                            </p>
                                            {((conv.unreadCount || 0) + (conv.user?.id ? (unreadCounts[conv.user.id] || 0) : 0)) > 0 && (
                                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] ml-2">
                                                    {conv.unreadCount || unreadCounts[conv.user?.id || ""] || 0}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )
                ) : (
                    // New Chat Tab
                    filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No users found to message.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setActiveChatUser(user)}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {user.firstName[0]}
                                                {user.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Only show green indicator when online */}
                                        {onlineUsers.includes(user.id) && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium truncate">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate capitalize">
                                            {user.role.replace("_", " ").toLowerCase()}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
