"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import EnvironmentVariables from "@/config/config";

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
  typing?: boolean;
}

interface Message {
  text: string;
  sender: "user" | "bot";
  id: string;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read";
}

const ChatPage = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    avatar?: string;
  } | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsername(
        searchQuery.trim()
          ? users.filter((user) =>
              user.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : users
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, users]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  // Simplified animation variants
  const messageVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20, scale: 0.9 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      },
      exit: { opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } },
      hover: {
        scale: 1.02,
        boxShadow: "0 8px 25px rgba(139, 92, 246, 0.15)",
        transition: { duration: 0.2 },
      },
    }),
    []
  );

  const chatItemVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, x: -20 },
      visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: {
          delay: 0.05 + i * 0.03,
          type: "spring",
          stiffness: 400,
          damping: 20,
        },
      }),
      hover: {
        scale: 1.02,
        x: 5,
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        boxShadow: "0 8px 25px rgba(139, 92, 246, 0.2)",
        transition: { duration: 0.2 },
      },
      tap: { scale: 0.98 },
    }),
    []
  );

  const modalVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, scale: 0.8, y: 30 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      },
      exit: { opacity: 0, scale: 0.8, y: -30, transition: { duration: 0.3 } },
    }),
    []
  );

  const backdropVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    }),
    []
  );

  const buttonVariants: Variants = useMemo(
    () => ({
      hover: {
        scale: 1.05,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 15 },
      },
      tap: { scale: 0.95 },
    }),
    []
  );

  const sidebarVariants: Variants = useMemo(
    () => ({
      hidden: { x: -320, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    }),
    []
  );

  const statusColors = {
    online: "bg-emerald-500 shadow-emerald-500/50",
    offline: "bg-slate-500 shadow-slate-500/50",
    away: "bg-amber-500 shadow-amber-500/50",
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const username = localStorage?.getItem("username") || "User";
      setCurrentUser({
        name: username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username
        )}&background=8b5cf6&color=fff&size=128`,
      });
      try {
        const [userListData, privateChatData] = await Promise.all([
          getUserList(),
          getPrivateChat(),
        ]);
        const usernames = userListData.usernames || userListData.data || userListData || [];
        const transformedUsers: User[] = usernames.map((user: any, index: number) => {
          if (typeof user === "string") {
            return {
              id: `user-${index}`,
              name: user,
              status: "online" as const,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user)}&background=8b5cf6&color=fff&size=128`,
              lastSeen: new Date(),
            };
          }
          const displayName = user.username || user.name || `User ${index + 1}`;
          return {
            id: user.id || user.username || `user-${index}`,
            name: displayName,
            status: "online" as const,
            avatar:
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff&size=128`,
            lastSeen: new Date(),
          };
        });
        setUsers(transformedUsers);
        setUsername(transformedUsers);
        // Set recent chats from privateChatData
        if (privateChatData && Array.isArray(privateChatData.chats)) {
          const chats = privateChatData.chats.map((chat: any, index: number) => {
            const name = chat.other_username || chat.username || chat.name;
            return {
              id: chat.id || chat._id || name,
              name,
              status: "offline",
              avatar:
                chat.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`,
              lastSeen: chat.lastSeen ? new Date(chat.lastSeen) : new Date(),
            };
          });
          setRecentChats(chats);
        } else {
          setRecentChats([]);
        }
      } catch (error) {
        console.error("Failed to fetch user list or chats:", error);
        setUsers([]);
        setUsername([]);
        setRecentChats([]);
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsLoading(false);
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (!activeChat) return;
    setIsLoading(true);
    const getMessages = async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setMessages([]);
      setIsLoading(false);
    };
    getMessages();
  }, [activeChat]);
  // this is a cleanup function for the readTimeoutRef
  useEffect(() => {
    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
        readTimeoutRef.current = null;
      }
    };
  }, [activeChat]);

  const handleLogout = useCallback(async () => {
    try {
      localStorage?.removeItem("username");
      localStorage?.removeItem("access_token");
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, [router]);


  // Helper for updating message status
  function updateMessageStatus(messages: Message[], id: string, status: Message["status"]) {
    return messages.map((msg) => (msg.id === id ? { ...msg, status } : msg));
  }

  // Helper for adding user to recent chats if not present
  function addUserToRecentChats(chats: User[], user: User) {
    return chats.some((chat) => chat.id === user.id) ? chats : [user, ...chats];
  }

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !activeChat) return;
    if (readTimeoutRef.current) {
      clearTimeout(readTimeoutRef.current);
      readTimeoutRef.current = null;
    }
    const newMessage: Message = {
      text: inputMessage,
      sender: "user",
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      status: "sending",
    };
    setIsSending(true);
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMessages((prev) => updateMessageStatus(prev, newMessage.id, "sent"));
    await new Promise((resolve) => setTimeout(resolve, 500));
    readTimeoutRef.current = setTimeout(() => {
      setMessages((prev) => updateMessageStatus(prev, newMessage.id, "read"));
      readTimeoutRef.current = null;
    }, 1000);
    setIsSending(false);
    inputRef.current?.focus();
  }, [inputMessage, activeChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && inputMessage.trim()) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [inputMessage, handleSendMessage]
  );

  const handleStartNewChat = useCallback(async () => {
    if (!newChatUsername.trim()) return;
    const existingUser = users.find((user) =>
      user.name.toLowerCase().includes(newChatUsername.toLowerCase())
    );
    if (existingUser) {
      setActiveChat(existingUser);
      // Add to recent chats if not already there
      setRecentChats((prev) => {
        const exists = prev.find((chat) => chat.id === existingUser.id);
        if (!exists) {
          return [existingUser, ...prev];
        }
        return prev;
      });
      setShowStartChatModal(false);
      setNewChatUsername("");
      return;
    }
    try {
      // Try to create a private chat with the backend
      await createPrivateChat(newChatUsername);
      // After creating, fetch the updated private chat list from backend
      const privateChatData = await getPrivateChat();
      if (privateChatData && Array.isArray(privateChatData.chats)) {
        const chats = privateChatData.chats.map((chat: any, index: number) => {
          const name = chat.other_username || chat.username || chat.name || `User ${index + 1}`;
          return {
            id: chat.id || chat._id || name,
            name,
            status: 'offline',
            avatar: chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`,
            lastSeen: chat.lastSeen ? new Date(chat.lastSeen) : new Date()
          };
        });
        setRecentChats(chats);
        // Optionally, set active chat to the new one
        const newChat = chats.find(c => c.name.toLowerCase() === newChatUsername.toLowerCase());
        if (newChat) setActiveChat(newChat);
      }
      setShowStartChatModal(false);
      setNewChatUsername("");
    } catch (error) {
      console.error('Failed to create private chat:', error);
      setShowStartChatModal(false);
      setNewChatUsername("");
    }
  }, [newChatUsername, users]);

  const handleKeyDownNewChat = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && newChatUsername.trim()) {
        e.preventDefault();
        handleStartNewChat();
      }
    },
    [newChatUsername, handleStartNewChat]
  );

  const formatTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getMessageStatusColor = (status?: string) => {
    return {
      sending: "text-gray-500",
      sent: "text-gray-400",
      delivered: "text-blue-400",
      read: "text-green-400",
    }[status || ""] || "text-gray-400";
  };

  const getMessageStatusIcon = (status?: string) => {
    if (status === "sending") {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full"
        />
      );
    }
    return { sent: "✓", delivered: "✓✓", read: "✓✓" }[status || ""] || "";
  };
  const getUserList = async () => {
    try {
      const token = localStorage?.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/user/usernames`,
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to fetch user list: ${res.status} - ${errorData}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching user list:", error);
      throw error;
    }
  };
  const getPrivateChat = async () => {
    try {
      const token = localStorage?.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/private`,
        {
          method: "GET",
          headers: headers,
        }
      );
      console.log(res.status);
      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to get private chats: ${res.status} - ${errorData}`);
      }
      const data = await res.json();
      console.log("This is the API response ", data);
      return data;
    } catch (error) {
      console.log("Error fetching users", error);
      throw error;
    }
  };
  const createPrivateChat = async (username: string) => {
    const newUser: User = {
      id: `new-${Date.now()}`,
      name: username,
      status: "offline",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username
      )}&background=8b5cf6&color=fff&size=128`,
      lastSeen: new Date(),
    };
    setActiveChat(newUser);
    setShowStartChatModal(false);
    // Add to recent chats
    setRecentChats((prev) => {
      const exists = prev.find((chat) => chat.name === username);
      if (!exists) {
        return [newUser, ...prev];
      }
      return prev;
    });
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/private`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            other_username: username,
          }),
        }
      );
      console.log(res.status);
      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to create private chat: ${res.status} - ${errorData}`);
      }
      const data = await res.json();
      console.log("This is the API response data: ", data);
      return data;
    } catch (error) {
      throw error;
    }
  };
  const getChatMessages = async (chatId: string) => {
    try{
      const token = localStorage?.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${chatId}/messages`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to fetch chat messages: ${res.status} - ${errorData}`);
      }
      const data = await res.json();
      setMessages(data.messages || []);
    }
    catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  }
  
  const sendMessageToChat = async (chatId: string, message: string, senderId: string) => {
    const reqBody = {
    "content": "string",
    "message_type": "text",
    "chat_id": chatId,
    "sender_id": senderId,
    "timestamp": new Date().toISOString(),
    "is_read": false,
    "is_edited": false,
    "edited_at": null
  }
    try {
      const token = localStorage?.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${chatId}/messages`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(reqBody),
        }
      );
      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to send message: ${res.status} - ${errorData}`);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
  


  // Helper function for active chat status
  function getActiveStatus(activeChat: User | null) {
    if (!activeChat) return { text: '', color: '' };
    if (activeChat.status === 'online') {
      return { text: 'Online', color: 'text-emerald-400' };
    } else if (activeChat.status === 'away') {
      return { text: 'Away', color: 'text-amber-400' };
    } else {
      return { text: `Last seen ${formatTime(activeChat.lastSeen || new Date())}`, color: 'text-gray-400' };
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity },
            }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Welcome to ChatApp
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-purple-300 text-sm"
          >
            Loading your chat...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const { text: activeStatusText, color: activeStatusColor } = getActiveStatus(activeChat);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex flex-col w-80 bg-gray-800/90 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl"
      >
        {/* User Profile Header */}
        <motion.div
          className="p-4 flex items-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-700/50"
          whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.9)" }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-lg shadow-purple-500/30 transition-all duration-200"
            />
            <motion.div
              className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-800"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-lg">{currentUser.name}</p>
            <motion.p
              className="text-xs text-emerald-400 flex items-center gap-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Online
            </motion.p>
          </div>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700/50">
          <motion.div className="relative">
            <motion.input
              type="text"
              placeholder="Search conversations..."
              className="w-full py-3 pl-12 pr-4 bg-gray-700/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600/50 border border-gray-600/30 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              whileFocus={{
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                scale: 1.02,
              }}
            />
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-3.5 text-gray-400"
              animate={searchQuery ? { scale: [1, 1.2, 1], rotate: [0, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </motion.svg>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-600 transition-all duration-200"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Start New Chat Button */}
        <div className="p-4 border-b border-gray-700/50">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowStartChatModal(true)}
            className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl text-white font-medium flex items-center justify-center gap-3 shadow-xl border border-purple-500/30 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </motion.svg>
            Start New Chat
          </motion.button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent Chats
          </h3>

          {recentChats.length === 0 ? (
            <div className="px-4 py-8 text-center"></div>
          ) : (
            <ul className="space-y-2 px-3 pb-4">
              <AnimatePresence>
                {recentChats.map((chat, index) => {
                  let statusText = "";
                  if (chat.status === "online") {
                    statusText = "Online";
                  } else if (chat.status === "away") {
                    statusText = "Away";
                  } else {
                    statusText = `Last seen ${formatTime(chat.lastSeen || new Date())}`;
                  }
                  // Try to get the name from all possible fields
                  const displayName = chat.name || chat.other_username || chat.username || chat.user_name || chat.user || chat.id || 'Unknown';
                  return (
                    <motion.li
                      key={chat.id}
                      variants={chatItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      whileHover="hover"
                      whileTap="tap"
                      className={`flex items-center p-4 rounded-2xl cursor-pointer border transition-colors ${
                        activeChat?.id === chat.id
                          ? "bg-purple-900/30 border-purple-500/50"
                          : "bg-gray-700/30 border-gray-600/30"
                      }`}
                      onClick={() => setActiveChat(chat)}
                    >
                      <div className="relative mr-4">
                        <img
                          src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff&size=128`}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover shadow-lg"
                        />
                        <div
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[chat.status]}`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-white">{displayName}</p>
                        <p className="text-sm text-gray-400 truncate">{statusText}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>

      {/* Mobile Sidebar Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-4/5 max-w-sm bg-gray-800/95 backdrop-blur-xl border-r border-gray-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-700/50">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-lg">{currentUser.name}</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>
              <div className="p-4 border-b border-gray-700/50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full py-3 pl-12 pr-4 bg-gray-700/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600/50 border border-gray-600/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute left-4 top-3.5 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <div className="p-4 border-b border-gray-700/50">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setShowStartChatModal(true);
                    setShowNewChatModal(false);
                  }}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl text-white font-medium flex items-center justify-center gap-3 shadow-xl"
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    whileHover={{ rotate: 90 }}
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </motion.svg>
                  Start New Chat
                </motion.button>
              </div>
              <div className="h-[calc(100%-200px)] overflow-y-auto">
                <h3 className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recent Chats
                </h3>

                {recentChats.length === 0 ? (
                  <div className="px-4 py-8 text-center"></div>
                ) : (
                  <ul className="space-y-2 px-3 pb-4">
                    {recentChats.map((chat) => {
                      let statusText = "";
                      if (chat.status === "online") {
                        statusText = "Online";
                      } else if (chat.status === "away") {
                        statusText = "Away";
                      } else {
                        statusText = `Last seen ${formatTime(chat.lastSeen || new Date())}`;
                      }
                      // Try to get the name from all possible fields
                      const displayName = chat.name || chat.other_username || chat.username || chat.user_name || chat.user || chat.id || 'Unknown';
                      return (
                        <motion.li
                          key={chat.id}
                          whileHover={{
                            backgroundColor: "rgba(139, 92, 246, 0.15)",
                            x: 8,
                          }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center p-4 rounded-2xl cursor-pointer border transition-colors ${
                            activeChat?.id === chat.id
                              ? "bg-purple-900/30 border-purple-500/50"
                              : "bg-gray-700/30 border-gray-600/30"
                          }`}
                          onClick={() => {
                            setActiveChat(chat);
                            setShowNewChatModal(false);
                          }}
                        >
                          <div className="relative mr-4">
                            <img
                              src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=8b5cf6&color=fff&size=128`}
                              alt={chat.name}
                              className="w-12 h-12 rounded-full object-cover shadow-lg"
                            />
                            <div
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[chat.status]}`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-white">{chat.name || chat.username || chat.other_username || 'Unknown'}</p>
                            <p className="text-sm text-gray-400 truncate">{statusText}</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start New Chat Modal */}
      <AnimatePresence>
        {showStartChatModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowStartChatModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/80 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-purple-500/30 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-tr from-purple-600 to-purple-400 p-3 rounded-2xl shadow-lg">
                  <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Start New Chat</h3>
                  <p className="text-purple-200 text-sm">Connect with someone new instantly</p>
                </div>
              </div>
              {/* Input Field */}
              <div className="mb-6 relative">
                <label htmlFor="new-chat-username" className="block text-sm font-medium text-purple-200 mb-2">Username</label>
                <input
                  id="new-chat-username"
                  type="text"
                  placeholder="Enter username to start chatting..."
                  className="w-full py-4 pl-12 pr-4 bg-gray-700/60 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-700 border border-gray-600/30 text-lg shadow-inner transition-all duration-200"
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  onKeyDown={handleKeyDownNewChat}
                  autoFocus
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              {/* Suggestions List */}
              <div className="mb-6">
                <ul className="space-y-1 px-2 pb-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700/40 scrollbar-track-transparent">
                  {username.length === 0 && newChatUsername.trim() ? (
                    <li className="text-gray-400 text-center py-4">No users found.</li>
                  ) : (
                    username.map((user) => {
                      let statusText = "";
                      if (user.status === "online") {
                        statusText = "Online";
                      } else if (user.status === "away") {
                        statusText = "Away";
                      } else {
                        statusText = `Last seen ${formatTime(user.lastSeen || new Date())}`;
                      }
                      return (
                        <motion.li
                          key={user.id}
                          variants={chatItemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                          className={`flex items-center p-3 rounded-xl cursor-pointer border transition-colors gap-3 ${activeChat?.id === user.id ? "bg-purple-900/30 border-purple-500/50" : "bg-gray-700/30 border-gray-600/30"}`}
                          onClick={() => {
                            const newUser: User = {
                              id: user.id,
                              name: user.name,
                              status: user.status,
                              avatar: user.avatar,
                              lastSeen: user.lastSeen,
                            };
                            setRecentChats((prev) => addUserToRecentChats(prev, newUser));
                            setShowStartChatModal(false);
                            createPrivateChat(user.name);
                          }}
                        >
                          <div className="relative">
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff&size=128`}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-purple-500/20"
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${statusColors[user.status]}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-white">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{statusText}</p>
                          </div>
                        </motion.li>
                      );
                    })
                  )}
                </ul>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 via-gray-600/30 to-purple-500/30" />
                <div className="flex-1 h-px bg-gradient-to-l from-purple-500/30 via-gray-600/30 to-purple-500/30" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20">
        {!activeChat ? (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Circular Gallery Animation */}
            <motion.div
              className="w-full max-w-4xl h-96 mb-8 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* <CircularGalleryWrapper
                bend={3}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollEase={0.02}
                items={[
                  { image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=600&fit=crop", text: "Alex Johnson" },
                  { image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop", text: "Sarah Williams" },
                  { image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", text: "Michael Brown" },
                  { image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=600&fit=crop", text: "Emily Davis" },
                  { image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=600&fit=crop", text: "David Wilson" },
                  { image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=600&fit=crop", text: "Lisa Anderson" },
                ]}
              /> */}
            </motion.div>

            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
            >
              Welcome to ChatApp
            </motion.h2>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 mb-8 max-w-md text-lg leading-relaxed"
            >
              Select a contact from the gallery above to start chatting, or search
              for someone new to connect with.
            </motion.p>
            <motion.div
              className="flex gap-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="md:hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-semibold shadow-xl border border-purple-500/30"
                onClick={() => setShowNewChatModal(true)}
              >
                Browse Contacts
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 rounded-2xl font-semibold border border-gray-600/30"
                onClick={() => setShowStartChatModal(true)}
              >
                Start New Chat
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Chat Header */}
            <motion.header
              className="p-4 bg-gray-800/80 border-b border-gray-700/50 flex items-center shadow-lg"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.button
                className="md:hidden mr-4 p-2 rounded-full hover:bg-gray-700/50"
                onClick={() => setShowNewChatModal(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </motion.button>
              <motion.div
                className="relative mr-4"
                whileHover={{ scale: 1.1 }}
              >
                <img
                  src={activeChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name)}&background=8b5cf6&color=fff&size=128`}
                  alt={activeChat.name}
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-purple-500/30"
                />
                <motion.div
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[activeChat.status]}`}
                  animate={activeChat.status === "online" ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold truncate text-lg text-white">
                  {activeChat.name}
                </h2>
                <motion.p className={`text-sm ${activeStatusColor}`}>
                  {activeStatusText}
                </motion.p>
              </div>
            </motion.header>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-transparent to-gray-900/20">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <motion.p
                      className="text-gray-400 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Loading messages...
                    </motion.p>
                  </motion.div>
                </div>
              ) : messages.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div className="mb-6 p-4 bg-purple-600/20 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-purple-400"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No messages yet
                  </h3>
                  <p className="text-gray-400 max-w-md text-lg">
                    Start the conversation by sending your first message to{" "}
                    {activeChat.name}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`flex ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <motion.div
                          className={`relative max-w-xs md:max-w-md lg:max-w-lg group ${
                            msg.sender === "user"
                              ? "bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl rounded-br-lg border-purple-500/30"
                              : "bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl rounded-bl-lg border-gray-600/30"
                          } p-4 shadow-xl border transition-all duration-200`}
                          whileHover={{
                            scale: 1.02,
                            boxShadow: "0 12px 30px rgba(139, 92, 246, 0.2)",
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="text-white leading-relaxed">{msg.text}</p>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-xs opacity-70 text-gray-200">
                              {formatTime(msg.timestamp)}
                            </span>
                            {msg.sender === "user" && (
                              <motion.div
                                className={`text-xs flex items-center gap-1 ${getMessageStatusColor(
                                  msg.status
                                )}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {getMessageStatusIcon(msg.status)}
                              </motion.div>
                            )}
                          </div>
                          <motion.div
                            className={`absolute bottom-0 ${
                              msg.sender === "user" ? "-right-1" : "-left-1"
                            } w-4 h-4 ${
                              msg.sender === "user" ? "bg-purple-600" : "bg-gray-700"
                            } transform rotate-45 border ${
                              msg.sender === "user"
                                ? "border-purple-500/30"
                                : "border-gray-600/30"
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <motion.div
              className="p-4 bg-gray-800/80 border-t border-gray-700/50"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 text-gray-400 hover:text-purple-400 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </motion.button>
                <div className="flex-1 relative">
                  <motion.textarea
                    ref={inputRef}
                    placeholder={`Message ${activeChat?.name || ""}...`}
                    className="w-full py-4 px-6 bg-gray-700/50 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600/50 border border-gray-600/30 max-h-32 min-h-[56px] resize-none transition-all duration-200"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    rows={1}
                    style={{ height: "auto", minHeight: "56px" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = Math.min(target.scrollHeight, 128) + "px";
                    }}
                    whileFocus={{ scale: 1.02 }}
                  />
                  <AnimatePresence>
                    {inputMessage.length > 100 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute bottom-2 right-4 text-xs text-gray-400"
                      >
                        {inputMessage.length}/1000
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`p-4 rounded-full shadow-lg transition-all duration-200 ${
                    inputMessage.trim() && !isSending
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/25 hover:shadow-purple-500/40"
                      : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={inputMessage.trim() ? { x: [0, 2, 0] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="m22 2-11 11" />
                    </motion.svg>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatPage;