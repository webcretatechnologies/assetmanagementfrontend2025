"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMessaging } from "@/lib/contexts/messaging-context";
import { UserList } from "./user-list";
import { ChatWindow } from "./chat-window";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { activeChatUser, setActiveChatUser, unreadCounts, isConnected } = useMessaging();

    // Calculate total unread
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    if (!isConnected) {
        // Maybe don't show or show disconnected state?
        // Usually good to show but disabled or with reconnecting spinner.
        // For now, let's show it.
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        drag
                        dragMomentum={false}
                        dragConstraints={{
                            top: -window.innerHeight + 650,
                            left: -window.innerWidth + 470,
                            right: 0,
                            bottom: 0
                        }}
                        className="pointer-events-auto cursor-move"
                    >
                        <Card className="w-[420px] h-[600px] shadow-2xl border-border/50 overflow-hidden flex flex-col rounded-xl">
                            {/* Header / Content Switcher */}
                            {activeChatUser ? (
                                <ChatWindow onBack={() => setActiveChatUser(null)} />
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between p-4 border-b bg-muted/30 cursor-grab active:cursor-grabbing">
                                        <h2 className="font-semibold">Team Chat</h2>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-muted"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <UserList />
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg pointer-events-auto transition-all duration-300",
                    isOpen ? "rotate-90 bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
                onClick={toggleChat}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <div className="relative">
                        <MessageCircle className="h-6 w-6" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-background animate-pulse">
                                {totalUnread}
                            </span>
                        )}
                    </div>
                )}
            </Button>
        </div>
    );
}
