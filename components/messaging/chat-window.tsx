"use client";

import { useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowLeft, Send, MoreVertical, Phone, Video, Check, CheckCheck, Pencil, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMessaging } from "@/lib/contexts/messaging-context";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";

interface ChatWindowProps {
    onBack: () => void;
}

export function ChatWindow({ onBack }: ChatWindowProps) {
    const { activeChatUser, messages, sendMessage, editMessage, deleteMessage, markAsRead, onlineUsers } = useMessaging();
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const [inputValue, setInputValue] = useState("");
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState("");
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; message: Message | null }>({ open: false, message: null });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter messages for this conversation
    const conversation = messages.filter((m) => {
        if (m.deletedForMe) return false; // Hide messages deleted for me
        const isIdMatch = m.senderId === activeChatUser?.id || m.receiverId === activeChatUser?.id;
        const isEmailMatch =
            (m.sender?.email && m.sender.email === activeChatUser?.email) ||
            (m.receiver?.email && m.receiver.email === activeChatUser?.email);
        return isIdMatch || isEmailMatch;
    });

    const isOnline = activeChatUser ? onlineUsers.includes(activeChatUser.id) : false;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversation.length]);

    // Mark unread messages as read
    useEffect(() => {
        conversation.forEach((msg) => {
            if (!msg.isRead && msg.senderId !== currentUser?.id) {
                markAsRead({ messageId: msg.id });
            }
        });
    }, [conversation, currentUser, markAsRead]);

    const handleSend = async () => {
        if (!inputValue.trim() || !activeChatUser) return;
        try {
            await sendMessage({ receiverId: activeChatUser.id, content: inputValue });
            setInputValue("");
        } catch (error) { }
    };

    const handleEdit = async () => {
        if (!editingMessage || !editContent.trim()) return;
        try {
            await editMessage({ messageId: editingMessage.id, newContent: editContent });
            setEditingMessage(null);
            setEditContent("");
        } catch (error) { }
    };

    const handleDelete = async (forEveryone: boolean) => {
        if (!deleteDialog.message) return;
        try {
            await deleteMessage({ messageId: deleteDialog.message.id, forEveryone });
            setDeleteDialog({ open: false, message: null });
        } catch (error) { }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (editingMessage) {
                handleEdit();
            } else {
                handleSend();
            }
        }
        if (e.key === "Escape" && editingMessage) {
            setEditingMessage(null);
            setEditContent("");
        }
    };

    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return format(date, "HH:mm");
        if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
        return format(date, "MMM d, HH:mm");
    };

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case "ORG_ADMIN":
            case "SUPER_ADMIN":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "BRANCH_MANAGER":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "INVENTORY_OPERATOR":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            default:
                return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    const renderTicks = (msg: Message) => {
        if (msg.senderId !== currentUser?.id) return null;

        const status = msg.status || (msg.isRead ? 'READ' : 'SENT');

        switch (status) {
            case 'READ':
                return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
            case 'DELIVERED':
                return <CheckCheck className="h-3.5 w-3.5" />;
            default:
                return <Check className="h-3.5 w-3.5" />;
        }
    };

    const startEdit = (msg: Message) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setEditContent("");
    };

    if (!activeChatUser) return null;

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <div className="px-3 py-3 border-b bg-background/80 backdrop-blur-sm flex items-center gap-3 shadow-sm">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-full hover:bg-muted">
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                            {activeChatUser.firstName[0]}{activeChatUser.lastName[0]}
                        </AvatarFallback>
                    </Avatar>
                    {/* Only show green indicator when online */}
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                    )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm leading-none truncate">
                            {activeChatUser.firstName} {activeChatUser.lastName}
                        </h3>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0", getRoleBadgeColor(activeChatUser.role))}>
                            {activeChatUser.role?.replace("_", " ")}
                        </span>
                    </div>
                    <p className={cn("text-[11px] mt-0.5", isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                        {isOnline ? "Online" : "Offline"}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-3">
                    {conversation.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                        {activeChatUser.firstName[0]}{activeChatUser.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="text-sm font-medium text-foreground">Start a conversation with {activeChatUser.firstName}</p>
                            <p className="text-xs text-muted-foreground mt-1">Send your first message below</p>
                        </div>
                    ) : (
                        conversation.map((msg, index) => {
                            const isMe = msg.senderId === currentUser?.id;
                            const isDeleted = !!msg.deletedAt;
                            const isEdited = !!msg.editedAt && !isDeleted;
                            const showAvatar = !isMe && (index === 0 || conversation[index - 1]?.senderId !== msg.senderId);

                            return (
                                <div key={msg.id} className={cn("flex w-full gap-2 group", isMe ? "justify-end" : "justify-start")}>
                                    {/* Avatar for received messages */}
                                    {!isMe && (
                                        <div className="w-7 flex-shrink-0">
                                            {showAvatar && (
                                                <Avatar className="h-7 w-7">
                                                    <AvatarFallback className="text-[10px] bg-muted">
                                                        {activeChatUser.firstName[0]}{activeChatUser.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-2.5 relative",
                                        isMe
                                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-md"
                                            : "bg-card border border-border/50 text-foreground rounded-bl-md shadow-sm",
                                        isDeleted && "italic opacity-70"
                                    )}>
                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>
                                        <div className={cn("flex items-center gap-1.5 mt-1", isMe ? "justify-end" : "justify-start")}>
                                            {isEdited && (
                                                <span className={cn("text-[9px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                                                    edited
                                                </span>
                                            )}
                                            <span className={cn("text-[10px] opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                                {formatMessageDate(new Date(msg.sentAt))}
                                            </span>
                                            {isMe && <span className="text-primary-foreground/70">{renderTicks(msg)}</span>}
                                        </div>
                                    </div>

                                    {/* Context Menu for own messages - positioned AFTER the bubble */}
                                    {isMe && !isDeleted && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                                                >
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => startEdit(msg)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteDialog({ open: true, message: msg })}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Edit Mode Banner */}
            {editingMessage && (
                <div className="px-3 py-2 bg-primary/10 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-medium">Editing message</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t bg-background/80 backdrop-blur-sm">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <Input
                            value={editingMessage ? editContent : inputValue}
                            onChange={(e) => editingMessage ? setEditContent(e.target.value) : setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                            className="rounded-full pr-12 py-5 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                    </div>
                    <Button
                        onClick={editingMessage ? handleEdit : handleSend}
                        size="icon"
                        disabled={editingMessage ? !editContent.trim() : !inputValue.trim()}
                        className={cn(
                            "h-10 w-10 rounded-full shadow-md transition-all duration-200",
                            (editingMessage ? editContent.trim() : inputValue.trim())
                                ? "bg-primary hover:bg-primary/90 hover:scale-105"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, message: open ? deleteDialog.message : null })}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Message</DialogTitle>
                        <DialogDescription>How would you like to delete this message?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button variant="outline" className="w-full" onClick={() => handleDelete(false)}>
                            Delete for me
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => handleDelete(true)}>
                            Delete for everyone
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => setDeleteDialog({ open: false, message: null })}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
