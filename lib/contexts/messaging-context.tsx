"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";
import { Message, NewMessageEvent, SendMessagePayload, User } from "@/lib/types";
import { getMessageHistory, HistoryMessage } from "@/lib/api/messages";
import { toast } from "sonner";

interface MessagingContextType {
    socket: Socket | null;
    isConnected: boolean;
    messages: Message[];
    activeChatUser: User | null;
    setActiveChatUser: (user: User | null) => void;
    sendMessage: (payload: SendMessagePayload) => Promise<void>;
    editMessage: (payload: { messageId: string; newContent: string }) => Promise<void>;
    deleteMessage: (payload: { messageId: string; forEveryone: boolean }) => Promise<void>;
    markAsRead: (payload: { messageId: string }) => Promise<void>;
    unreadCounts: Record<string, number>;
    onlineUsers: string[];
    setOnlineUsers: React.Dispatch<React.SetStateAction<string[]>>;
} 

const MessagingContext = createContext<MessagingContextType | null>(null);

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (!context) {
        throw new Error("useMessaging must be used within a MessagingProvider");
    }
    return context;
};

export function MessagingProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // In a real app, we might get online users from a periodic event or presence system
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    // Get auth user and token from Redux
    const { user: authUser, access_token } = useAppSelector((state) => state.auth);

    const getStoredToken = () => {
        if (access_token) return access_token;
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    };

    // Ref to track active user for unread logic
    const activeUserRef = useRef<string | null>(null);

    useEffect(() => {
        if (!authUser) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = getStoredToken();
        if (!token) return;

        // Determine URL. User request says `/messaging` (Namespace).
        // It implies the same host.
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

        // Initialize Socket
        // Namespace: /messaging
        const newSocket = io(`${socketUrl}/messaging`, {
            auth: {
                token: token
            },
            transports: ["websocket"],
            reconnectionAttempts: 5,
        });

        newSocket.on("connect", () => {
            console.log("Messaging WebSocket Connected");
            setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
            console.log("Messaging WebSocket Disconnected");
            setIsConnected(false);
        });

        newSocket.on("connect_error", (err) => {
            console.error("Messaging Connection Error:", err.message);
            // Optionally toast only if it's not a standard disconnect
        });

        // Listen for new messages
        newSocket.on("newMessage", (event: NewMessageEvent) => {
            console.log("New Message Received:", event);

            // Map event to Message interface
            const newMessage: Message = {
                id: event.id,
                senderId: event.sender.id,
                receiverId: event.receiverId,
                content: event.content,
                organizationId: "", // Not provided in event, maybe not needed for UI display
                branchId: event.branchId,
                isRead: event.isRead,
                sentAt: event.sentAt,
                sender: {
                    ...event.sender,
                    email: event.sender.email || "", // Use provided email or empty
                }
            };

            setMessages((prev) => [...prev, newMessage]);

            // Only increment unread and show toast if NOT currently chatting with this sender
            const isChatOpenWithSender = activeUserRef.current === event.sender.id;

            if (!isChatOpenWithSender) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [event.sender.id]: (prev[event.sender.id] || 0) + 1
                }));
                toast.info(`New message from ${event.sender.firstName}`);
            }
        });

        // Listen for user online status changes
        newSocket.on("userOnline", (data: { userId: string }) => {
            console.log("User came online:", data.userId);
            setOnlineUsers((prev) => {
                if (!prev.includes(data.userId)) {
                    return [...prev, data.userId];
                }
                return prev;
            });
        });

        newSocket.on("userOffline", (data: { userId: string; lastSeen: string }) => {
            console.log("User went offline:", data.userId, "Last seen:", data.lastSeen);
            setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [authUser, access_token]);

    useEffect(() => {
        activeUserRef.current = activeChatUser?.id || null;
        if (activeChatUser) {
            // Clear unread for this user
            setUnreadCounts((prev) => ({ ...prev, [activeChatUser.id]: 0 }));
        }
    }, [activeChatUser]);

    // Load chat history when activeChatUser changes
    useEffect(() => {
        const loadChatHistory = async () => {
            if (!activeChatUser || !access_token) return;

            try {
                const history = await getMessageHistory(access_token, activeChatUser.id);

                // Map HistoryMessage to Message type
                const mappedHistory: Message[] = history.map((msg: HistoryMessage) => ({
                    id: msg.id,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    content: msg.content,
                    organizationId: msg.organizationId,
                    branchId: msg.branchId,
                    isRead: msg.isRead,
                    sentAt: msg.sentAt,
                }));

                // Merge with existing messages, avoiding duplicates
                setMessages((prev) => {
                    const messageMap = new Map<string, Message>();
                    // Add historical messages first
                    mappedHistory.forEach((msg) => messageMap.set(msg.id, msg));
                    // Then add existing messages (will overwrite if same ID, keeping real-time version)
                    prev.forEach((msg) => messageMap.set(msg.id, msg));
                    // Convert back to array and sort by sentAt
                    return Array.from(messageMap.values()).sort(
                        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                    );
                });
            } catch (error) {
                console.error("Failed to load chat history:", error);
            }
        };

        loadChatHistory();
    }, [activeChatUser, access_token]);

    const sendMessage = useCallback(async (payload: SendMessagePayload) => {
        if (!socket) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit("sendMessage", payload, (response: any) => {
                if (response.status === "ok") {
                    // Add to our local list instantly
                    const sentMsg: Message = {
                        ...response.data,
                        organizationId: authUser?.orgId || "",
                        branchId: authUser?.branchId || "",
                        isRead: false,
                        sender: authUser ? {
                            id: authUser.id,
                            firstName: authUser.firstName, // Assuming partial user object
                            lastName: authUser.lastName,
                            role: authUser.role as any, // Cast if needed
                            email: authUser.email
                        } : undefined
                    };
                    setMessages((prev) => [...prev, sentMsg]);
                    resolve();
                } else {
                    toast.error(response.message || "Failed to send message");
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket, authUser]);

    const editMessage = useCallback(async (payload: { messageId: string; newContent: string }) => {
        if (!socket) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit("editMessage", payload, (response: any) => {
                if (response.status === "ok") {
                    // Update local message
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.messageId
                                ? { ...msg, content: payload.newContent, editedAt: new Date().toISOString() }
                                : msg
                        )
                    );
                    resolve();
                } else {
                    toast.error(response.message || "Failed to edit message");
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const deleteMessage = useCallback(async (payload: { messageId: string; forEveryone: boolean }) => {
        if (!socket) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit("deleteMessage", payload, (response: any) => {
                if (response.status === "ok") {
                    if (payload.forEveryone) {
                        // Mark as deleted for everyone
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.messageId
                                    ? { ...msg, deletedAt: new Date().toISOString(), content: "This message was deleted" }
                                    : msg
                            )
                        );
                    } else {
                        // Delete for me only - set a flag to hide it
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.messageId
                                    ? { ...msg, deletedForMe: true }
                                    : msg
                            )
                        );
                    }
                    resolve();
                } else {
                    toast.error(response.message || "Failed to delete message");
                    reject(new Error(response.message));
                }
            });
        });
    }, [socket]);

    const markAsRead = useCallback(async (payload: { messageId: string }) => {
        if (!socket) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit("markAsRead", payload, (response: any) => {
                if (response.status === "ok") {
                    // Update local message state
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.messageId
                                ? { ...msg, isRead: true, status: 'READ' }
                                : msg
                        )
                    );
                    resolve();
                } else {
                    // Silent fail for markAsRead - don't bother user with toasts
                    reject(new Error(response?.message || "Failed to mark as read"));
                }
            });
        });
    }, [socket]);

    return (
        <MessagingContext.Provider
            value={{
                socket,
                isConnected,
                messages,
                activeChatUser,
                setActiveChatUser,
                sendMessage,
                editMessage,
                deleteMessage,
                markAsRead,
                unreadCounts,
                onlineUsers,
                setOnlineUsers
            }}
        >
            {children}
        </MessagingContext.Provider>
    );
}
