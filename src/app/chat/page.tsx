"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants, stagger } from 'framer-motion';
import EnvironmentVariables from '@/config/config';

interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  typing?: boolean;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  id: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface Chat {
  id: string | number;
  title?: string;
  participants?: any[];
  other_user?: {
    username: string;
    id: string | number;
  };
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const ChatPage = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; avatar?: string } | null>(null);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [userListError, setUserListError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Helper functions
  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = localStorage?.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      localStorage?.removeItem('access_token');
      localStorage?.removeItem('username');
      router.push('/login');
      return;
    }
    setApiError(`Failed to ${context.toLowerCase()}. Please try again.`);
    setTimeout(() => setApiError(null), 5000);
  }, [router]);

  const validateAndConvertId = useCallback((id: string | number): string => String(id), []);

  const transformUserData = useCallback((userData: any, index: number = 0): User => {
    if (typeof userData === 'string') {
      return {
        id: `user-${userData}-${index}`,
        name: userData,
        status: 'online' as const,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData)}&background=8b5cf6&color=fff&size=128`,
        lastSeen: new Date()
      };
    }
    return {
      id: userData.id || userData.user_id || userData.username || `user-${index}`,
      name: userData.username || userData.name || userData.display_name || `User ${index + 1}`,
      status: userData.status || userData.is_online ? 'online' : 'offline',
      avatar: userData.avatar || userData.profile_picture || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || userData.name || `User ${index + 1}`)}&background=8b5cf6&color=fff&size=128`,
      lastSeen: userData.last_seen ? new Date(userData.last_seen) : new Date()
    };
  }, []);

  const transformChatData = useCallback((chatData: Chat): User => {
    const otherUser = chatData.other_user;
    const chatTitle = chatData.title || (otherUser?.username) || (chatData.participants?.[0]?.username) || `Chat ${chatData.id}`;
    return {
      id: chatData.id,
      name: chatTitle,
      status: 'online' as const,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatTitle)}&background=8b5cf6&color=fff&size=128`,
      lastSeen: new Date()
    };
  }, []);

  const transformMessageData = useCallback((messageData: any): Message => {
    const currentUsername = currentUser?.name || localStorage?.getItem('username');
    return {
      text: messageData.content || messageData.message || messageData.text || "",
      sender: (messageData.sender === currentUsername || 
               messageData.sender_username === currentUsername ||
               messageData.user?.username === currentUsername ||
               messageData.is_own) ? 'user' : 'bot',
      id: String(messageData.id || messageData.message_id || `msg-${Date.now()}-${Math.random()}`),
      timestamp: messageData.created_at ? new Date(messageData.created_at) : 
                 messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
      status: messageData.is_read ? 'read' : 
              messageData.status || 
              (messageData.sender === currentUsername ? 'sent' : 'delivered')
    };
  }, [currentUser?.name]);

  // API Functions
  const getUserList = useCallback(async (): Promise<User[]> => {
    try {
      const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/usernames`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      const usernames = data.usernames || data.data || data.users || data || [];
      if (!Array.isArray(usernames)) return [];
      return usernames.map((user: any, index: number) => transformUserData(user, index));
    } catch (error) {
      handleApiError(error, 'fetch users');
      return [];
    }
  }, [getAuthHeaders, transformUserData, handleApiError]);

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim()) return allUsers;
    try {
      const response = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/user/usernames?search=${encodeURIComponent(query)}`,
        { method: 'GET', headers: getAuthHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        throw new Error(`Search failed: ${response.status}`);
      }
      const data = await response.json();
      const searchResults = data.usernames || data.data || data.users || data || [];
      if (!Array.isArray(searchResults)) {
        return allUsers.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
      }
      return searchResults.map((user: any, index: number) => transformUserData(user, index));
    } catch (error) {
      return allUsers.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
    }
  }, [allUsers, getAuthHeaders, transformUserData]);

  const getPrivateChats = useCallback(async (): Promise<User[]> => {
    try {
      const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/chat/private`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        if (response.status === 404) return [];
        throw new Error(`Failed to get chats: ${response.status}`);
      }
      const data = await response.json();
      let chats: Chat[] = Array.isArray(data) ? data : data.chats || data.data || data.private_chats || [];
      return chats.map(transformChatData);
    } catch (error) {
      handleApiError(error, 'fetch chats');
      return [];
    }
  }, [getAuthHeaders, transformChatData, handleApiError]);

  const getChatMessages = useCallback(async (chatId: string | number): Promise<Message[]> => {
    try {
      if (!chatId) throw new Error('Chat ID is required');
      const response = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${validateAndConvertId(chatId)}/messages`,
        { method: 'GET', headers: getAuthHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        if (response.status === 404) return [];
        throw new Error(`Failed to get messages: ${response.status}`);
      }
      const data = await response.json();
      let msgs: any[] = Array.isArray(data) ? data : data.messages || data.data || [];
      return msgs.map(transformMessageData);
    } catch (error) {
      handleApiError(error, 'fetch messages');
      return [];
    }
  }, [getAuthHeaders, validateAndConvertId, transformMessageData, handleApiError]);

  const sendMessageToChat = useCallback(async (message: string, chatId: string | number): Promise<boolean> => {
    try {
      if (!message.trim() || !chatId) throw new Error('Message and chat ID are required');
      const response = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${validateAndConvertId(chatId)}/messages`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: message.trim(), message_type: 'text', chat_id: validateAndConvertId(chatId) })
        }
      );
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        throw new Error(`Failed to send message: ${response.status}`);
      }
      await response.json();
      return true;
    } catch (error) {
      handleApiError(error, 'send message');
      return false;
    }
  }, [getAuthHeaders, validateAndConvertId, handleApiError]);

  const markMessagesAsRead = useCallback(async (chatId: string | number): Promise<boolean> => {
    try {
      if (!chatId) return false;
      const response = await fetch(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${validateAndConvertId(chatId)}/messages/mark-read`,
        { method: 'POST', headers: getAuthHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        console.warn(`Failed to mark messages as read: ${response.status}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, [getAuthHeaders, validateAndConvertId]);

  const createPrivateChat = useCallback(async (username: string): Promise<{ id: string; title: string } | null> => {
    try {
      if (!username.trim()) throw new Error('Username is required');
      const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/chat/private`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ other_username: username.trim() })
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again');
        if (response.status === 409) throw new Error('Chat already exists with this user');
        if (response.status === 404) throw new Error('User not found');
        throw new Error(`Failed to create chat: ${response.status}`);
      }
      const data = await response.json();
      return {
        id: data.id || data.chat_id || data.data?.id,
        title: data.title || `Chat with ${username}`
      };
    } catch (error) {
      handleApiError(error, 'create chat');
      return null;
    }
  }, [getAuthHeaders, handleApiError]);

  // Effects
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.trim()) {
        setUserListError(null);
        const searchResults = await searchUsers(searchQuery);
        setUsers(searchResults);
      } else {
        setUsers(allUsers);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, searchUsers, allUsers]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      const username = localStorage?.getItem('username') || 'User';
      setCurrentUser({
        name: username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8b5cf6&color=fff&size=128`
      });
      try {
        const [userList, chatList] = await Promise.all([getUserList(), getPrivateChats()]);
        setAllUsers(userList);
        setUsers(userList);
        setRecentChats(chatList);
      } catch (error) {
        setUserListError('Failed to load data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, [getUserList, getPrivateChats]);

  useEffect(() => {
    if (!activeChat?.id) return;
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const msgs = await getChatMessages(activeChat.id);
        setMessages(msgs);
        if (msgs.length > 0) await markMessagesAsRead(activeChat.id);
      } catch (error) {
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
    return () => {
      if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
    };
  }, [activeChat?.id, getChatMessages, markMessagesAsRead]);

  // Handlers
  const handleLogout = useCallback(() => {
    localStorage?.removeItem('username');
    localStorage?.removeItem('access_token');
    router.push('/');
  }, [router]);

  const handleStartNewChat = useCallback(async (selectedUser: User) => {
    setApiError(null);
    const chatData = await createPrivateChat(selectedUser.name);
    if (chatData) {
      const newChatUser: User = {
        id: chatData.id,
        name: selectedUser.name,
        status: selectedUser.status,
        avatar: selectedUser.avatar,
        lastSeen: new Date()
      };
      setActiveChat(newChatUser);
      setRecentChats(prev => prev.find(chat => chat.name === newChatUser.name) ? prev : [newChatUser, ...prev]);
    } else {
      setActiveChat(selectedUser);
      setApiError('Chat created locally. Messages may not sync properly.');
      setRecentChats(prev => prev.find(chat => chat.name === selectedUser.name) ? prev : [selectedUser, ...prev]);
    }
    setShowStartChatModal(false);
    setSearchQuery('');
    setShowMobileSidebar(false);
  }, [createPrivateChat]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !activeChat || isSending) return;
    if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
    const messageText = inputMessage.trim();
    const tempId = `msg-${Date.now()}-${Math.random()}`;
    const newMessage: Message = { text: messageText, sender: 'user', id: tempId, timestamp: new Date(), status: 'sending' };
    setIsSending(true);
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    const success = await sendMessageToChat(messageText, activeChat.id);
    setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: success ? 'sent' : 'failed' } : msg));
    if (success) {
      setTimeout(() => setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'delivered' } : msg)), 500);
      readTimeoutRef.current = setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'read' } : msg));
      }, 1500);
    }
    setIsSending(false);
    inputRef.current?.focus();
  }, [inputMessage, activeChat, isSending, sendMessageToChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim() && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [inputMessage, isSending, handleSendMessage]);

  const handleCreateNewChatFromModal = useCallback(async () => {
    if (!newChatUsername.trim()) return;
    const existingUser = allUsers.find(user => user.name.toLowerCase() === newChatUsername.toLowerCase());
    if (existingUser) {
      await handleStartNewChat(existingUser);
    } else {
      const chatData = await createPrivateChat(newChatUsername);
      if (chatData) {
        const newUser: User = {
          id: chatData.id,
          name: newChatUsername,
          status: 'offline',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newChatUsername)}&background=8b5cf6&color=fff&size=128`,
          lastSeen: new Date()
        };
        setActiveChat(newUser);
        setRecentChats(prev => [newUser, ...prev.filter(chat => chat.name !== newUser.name)]);
        setShowStartChatModal(false);
      } else {
        setApiError('Failed to create chat. User may not exist.');
      }
    }
    setNewChatUsername("");
  }, [newChatUsername, allUsers, handleStartNewChat, createPrivateChat]);

  const handleKeyDownNewChat = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newChatUsername.trim()) {
      e.preventDefault();
      handleCreateNewChatFromModal();
    }
  }, [newChatUsername, handleCreateNewChatFromModal]);

  const formatTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getMessageStatusColor = (status?: string) => ({
    sending: 'text-gray-500',
    sent: 'text-gray-400',
    delivered: 'text-blue-400',
    read: 'text-green-400',
    failed: 'text-red-400'
  }[status || ''] || 'text-gray-400');

  const getMessageStatusIcon = (status?: string) => {
    if (status === 'sending') return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full"
      />
    );
    return { sent: '✓', delivered: '✓✓', read: '✓✓', failed: "!" }[status || ''] || '';
  };

  const statusColors = {
    online: 'bg-emerald-500 shadow-emerald-500/50',
    offline: 'bg-slate-500 shadow-slate-500/50',
    away: 'bg-amber-500 shadow-amber-500/50'
  };

  // Animation variants
  const messageVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
    exit: { opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } },
  }), []);

  const messageListVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }), []);

  const chatItemVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0, x: -20 },
    visible: (i: number = 0) => ({ opacity: 1, x: 0, transition: { delay: 0.05 + i * 0.03, type: "spring", stiffness: 400, damping: 20 } }),
    hover: { scale: 1.02, x: 5, backgroundColor: 'rgba(139, 92, 246, 0.15)' },
  }), []);

  const modalVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.8, y: -30, transition: { duration: 0.3 } }
  }), []);

  const backdropVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  }), []);

  const buttonVariants: Variants = useMemo(() => ({
    hover: { scale: 1.05, y: -2, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { scale: 0.95 }
  }), []);

  const sidebarVariants: Variants = useMemo(() => ({
    hidden: { x: -320, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
  }), []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 text-white font-sans overflow-hidden">
      {/* API Error Toast */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border border-red-500"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {apiError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        recentChats={recentChats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        setShowStartChatModal={setShowStartChatModal}
        handleLogout={handleLogout}
        statusColors={statusColors}
        formatTime={formatTime}
        userListError={userListError}
        sidebarVariants={sidebarVariants}
        chatItemVariants={chatItemVariants}
        buttonVariants={buttonVariants}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar 
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        recentChats={recentChats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        setShowStartChatModal={setShowStartChatModal}
        handleLogout={handleLogout}
        statusColors={statusColors}
        formatTime={formatTime}
        buttonVariants={buttonVariants}
        backdropVariants={backdropVariants}
      />

      {/* Start New Chat Modal */}
      <StartChatModal
        showStartChatModal={showStartChatModal}
        setShowStartChatModal={setShowStartChatModal}
        newChatUsername={newChatUsername}
        setNewChatUsername={setNewChatUsername}
        users={users}
        handleStartNewChat={handleStartNewChat}
        handleCreateNewChatFromModal={handleCreateNewChatFromModal}
        handleKeyDownNewChat={handleKeyDownNewChat}
        statusColors={statusColors}
        formatTime={formatTime}
        modalVariants={modalVariants}
        backdropVariants={backdropVariants}
        chatItemVariants={chatItemVariants}
        buttonVariants={buttonVariants}
      />

      {/* Main Chat Area */}
      <MainChatArea 
        activeChat={activeChat}
        setShowMobileSidebar={setShowMobileSidebar}
        setShowStartChatModal={setShowStartChatModal}
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleKeyDown={handleKeyDown}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
        statusColors={statusColors}
        formatTime={formatTime}
        getMessageStatusColor={getMessageStatusColor}
        getMessageStatusIcon={getMessageStatusIcon}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
        messageVariants={messageVariants}
        messageListVariants={messageListVariants}
        buttonVariants={buttonVariants}
      />
    </div>
  );
};

const Sidebar = React.memo(({ currentUser, searchQuery, setSearchQuery, recentChats, activeChat, setActiveChat, setShowStartChatModal, handleLogout, statusColors, formatTime, userListError, sidebarVariants, chatItemVariants, buttonVariants }: any) => (
  <motion.div
    variants={sidebarVariants}
    initial="hidden"
    animate="visible"
    className="hidden md:flex flex-col w-80 bg-gray-800/90 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl"
  >
    {/* User Profile Header */}
    <motion.div 
      className="p-4 flex items-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-700/50"
      whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.9)", scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }} 
        whileTap={{ scale: 0.95 }} 
        className="relative"
      >
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-lg"
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
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
        title="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </motion.button>
    </motion.div>

    {/* Search Bar */}
    <div className="p-4 border-b border-gray-700/50">
      <motion.div className="relative" whileHover={{ scale: 1.01 }}>
        <motion.input
          type="text"
          placeholder="Search conversations..."
          className="w-full py-3 pl-12 pr-4 bg-gray-700/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600/50 border border-gray-600/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          whileFocus={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)", scale: 1.02 }}
          transition={{ duration: 0.2 }}
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
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </motion.svg>
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
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
        className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl text-white font-medium flex items-center justify-center gap-3 shadow-xl border border-purple-500/30"
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
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </motion.svg>
        Start New Chat
      </motion.button>
    </div>

    {/* User List */}
    <div className="flex-1 overflow-y-auto">
      <h3 className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Chats</h3>
      {userListError && (
        <div className="px-4 py-2 mx-4 mb-4 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {userListError}
        </div>
      )}
      {recentChats.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No recent chats. Start a new conversation!
        </div>
      ) : (
        <ul className="space-y-2 px-3 pb-4">
          <AnimatePresence>
            {recentChats.map((chat: User, index: number) => (
              <motion.li
                key={chat.id}
                variants={chatItemVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                className={`flex items-center p-4 rounded-2xl cursor-pointer border transition-colors ${activeChat?.id === chat.id ? 'bg-purple-900/30 border-purple-500/50' : 'bg-gray-700/30 border-gray-600/30'}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="relative mr-4">
                  <img 
                    src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=8b5cf6&color=fff&size=128`} 
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover shadow-lg"
                  />
                  <motion.div 
                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[chat.status]}`}
                    animate={chat.status === 'online' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-white">{chat.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {chat.status === 'online' ? 'Online' : 
                     chat.status === 'away' ? 'Away' : `Last seen ${formatTime(chat.lastSeen || new Date())}`}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  </motion.div>
));

const MobileSidebar = React.memo(({ showMobileSidebar, setShowMobileSidebar, currentUser, searchQuery, setSearchQuery, recentChats, activeChat, setActiveChat, setShowStartChatModal, handleLogout, statusColors, formatTime, buttonVariants, backdropVariants }: any) => (
  <AnimatePresence>
    {showMobileSidebar && (
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
        onClick={() => setShowMobileSidebar(false)}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileSidebar(false)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-3.5 text-gray-400">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>
          <div className="p-4 border-b border-gray-700/50">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => { setShowStartChatModal(true); setShowMobileSidebar(false); }}
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
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </motion.svg>
              Start New Chat
            </motion.button>
          </div>
          <div className="h-[calc(100%-200px)] overflow-y-auto">
            <h3 className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Chats</h3>
            {recentChats.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No recent chats</div>
            ) : (
              <ul className="space-y-2 px-3 pb-4">
                {recentChats.map((chat: User) => (
                  <motion.li
                    key={chat.id}
                    whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', x: 8 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center p-4 rounded-2xl cursor-pointer border transition-colors ${activeChat?.id === chat.id ? 'bg-purple-900/30 border-purple-500/50' : 'bg-gray-700/30 border-gray-600/30'}`}
                    onClick={() => { setActiveChat(chat); setShowMobileSidebar(false); }}
                  >
                    <div className="relative mr-4">
                      <img 
                        src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=8b5cf6&color=fff&size=128`} 
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                      <motion.div 
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[chat.status]}`}
                        animate={chat.status === 'online' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-white">{chat.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {chat.status === 'online' ? 'Online' : 
                         chat.status === 'away' ? 'Away' : `Last seen ${formatTime(chat.lastSeen || new Date())}`}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

const StartChatModal = React.memo(({ showStartChatModal, setShowStartChatModal, newChatUsername, setNewChatUsername, users, handleStartNewChat, handleCreateNewChatFromModal, handleKeyDownNewChat, statusColors, formatTime, modalVariants, backdropVariants, chatItemVariants, buttonVariants }: any) => (
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
          className="bg-gray-800/95 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-700/50 max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-2xl font-bold text-white mb-1">Start New Chat</h3>
            <p className="text-gray-400 text-sm">Search users to start chatting</p>
          </motion.div>
          <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label htmlFor="new-chat-username" className="block text-base font-semibold text-white mb-2 tracking-wide">
              Username
            </label>
            <div className="relative">
              <motion.input
                id="new-chat-username"
                type="text"
                placeholder="Enter username or search..."
                className="w-full py-4 px-6 bg-gray-900/70 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:bg-gray-800/80 border-2 border-transparent focus:border-purple-500 text-lg shadow-md outline: none !important"
                value={newChatUsername}
                onChange={(e) => setNewChatUsername(e.target.value)}
                onKeyDown={handleKeyDownNewChat}
                autoFocus
                whileFocus={{ scale: 1.03, boxShadow: "0 0 0 2px #a78bfa" }}
                transition={{ duration: 0.2 }}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-400">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
            </div>
          </motion.div>
          <motion.div 
            className="flex-1 overflow-y-auto mb-6"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            initial="hidden"
            animate="visible"
          >
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {newChatUsername.length > 0 ? 'Search Results' : 'Available Users'}
            </h4>
            <ul className="space-y-1 px-2">
              {users.length === 0 ? (
                <li className="text-center text-gray-400 py-8">
                  {newChatUsername.length > 0 ? 'No users found.' : 'Type to search for users...'}
                </li>
              ) : (
                users.map((user: User) => (
                  <motion.li
                    key={user.id}
                    variants={chatItemVariants}
                    whileHover={{ scale: 1.03, backgroundColor: "#2a2040" }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all bg-gray-900/60 border-transparent hover:border-purple-400/40`}
                    onClick={() => handleStartNewChat(user)}
                  >
                    <div className="relative flex-shrink-0">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff&size=128`} 
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-purple-500/20 bg-gray-800"
                      />
                      <motion.span 
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors[user.status]}`}
                        animate={user.status === 'online' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-white text-lg">{user.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {user.status === 'online' ? 'Online' : 
                         user.status === 'away' ? 'Away' : `Last seen ${formatTime(user.lastSeen || new Date())}`}
                      </p>
                    </div>
                  </motion.li>
                ))
              )}
            </ul>
          </motion.div>
          {newChatUsername.trim() && (
            <motion.div 
              className="border-t border-gray-700/50 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCreateNewChatFromModal}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 shadow-xl border border-purple-500/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Start Chat with {newChatUsername}
              </motion.button>
            </motion.div>
          )}
          <motion.div className="mt-4 text-sm text-gray-400 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Press Enter or click to start chatting
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

const MainChatArea = React.memo(({ activeChat, setShowMobileSidebar, setShowStartChatModal, messages, isLoading, isTyping, inputMessage, setInputMessage, handleKeyDown, handleSendMessage, isSending, statusColors, formatTime, getMessageStatusColor, getMessageStatusIcon, messagesEndRef, inputRef, messageVariants, messageListVariants, buttonVariants }: any) => (
  <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20">
    {!activeChat ? (
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div 
          className="w-full max-w-2xl mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div className="mb-8 p-8 bg-gradient-to-br from-purple-900/30 to-gray-800/30 rounded-3xl border border-purple-500/20 backdrop-blur-sm" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </motion.div>
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
            >
              Welcome to ChatApp
            </motion.h2>
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 text-lg leading-relaxed"
            >
              Connect with friends, colleagues, and new people. Start a conversation to begin your chat experience.
            </motion.p>
          </motion.div>
        </motion.div>
        <motion.div className="flex gap-4" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-semibold shadow-xl border border-purple-500/30"
            onClick={() => setShowMobileSidebar(true)}
          >
            Browse Contacts
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl font-semibold shadow-xl border border-purple-500/30 text-white"
            onClick={() => setShowStartChatModal(true)}
          >
            Start New Chat
          </motion.button>
        </motion.div>
      </motion.div>
    ) : (
      <>
        {/* Chat Header */}
        <ChatHeader 
          activeChat={activeChat}
          setShowMobileSidebar={setShowMobileSidebar}
          isTyping={isTyping}
          statusColors={statusColors}
          formatTime={formatTime}
        />

        {/* Messages Area */}
        <MessageList 
          isLoading={isLoading}
          messages={messages}
          isTyping={isTyping}
          formatTime={formatTime}
          getMessageStatusColor={getMessageStatusColor}
          getMessageStatusIcon={getMessageStatusIcon}
          messagesEndRef={messagesEndRef}
          messageVariants={messageVariants}
          messageListVariants={messageListVariants}
          activeChat={activeChat}
        />

        {/* Message Input */}
        <MessageInput 
          activeChat={activeChat}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleKeyDown={handleKeyDown}
          handleSendMessage={handleSendMessage}
          isSending={isSending}
          inputRef={inputRef}
          buttonVariants={buttonVariants}
        />
      </>
    )}
  </main>
));

const ChatHeader = React.memo(({ activeChat, setShowMobileSidebar, isTyping, statusColors, formatTime }: any) => (
  <motion.header 
    className="p-4 bg-gray-800/80 border-b border-gray-700/50 flex items-center shadow-lg"
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <motion.button 
      className="md:hidden mr-4 p-2 rounded-full hover:bg-gray-700/50"
      onClick={() => setShowMobileSidebar(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </motion.button>
    <motion.div className="relative mr-4" whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
      <img 
        src={activeChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name)}&background=8b5cf6&color=fff&size=128`} 
        alt={activeChat.name}
        className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-purple-500/30"
      />
      <motion.div 
        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${statusColors[activeChat.status]}`}
        animate={activeChat.status === 'online' ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
    <div className="flex-1 min-w-0">
      <h2 className="font-bold truncate text-lg text-white">{activeChat.name}</h2>
      <motion.p 
        className={`text-sm ${activeChat.status === 'online' ? 'text-emerald-400' : activeChat.status === 'away' ? 'text-amber-400' : 'text-gray-400'}`}
        animate={isTyping ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {isTyping ? 'Typing...' : 
         activeChat.status === 'online' ? 'Online' : 
         activeChat.status === 'away' ? 'Away' : `Last seen ${formatTime(activeChat.lastSeen || new Date())}`}
      </motion.p>
    </div>
  </motion.header>
));

const MessageList = React.memo(({ isLoading, messages, isTyping, formatTime, getMessageStatusColor, getMessageStatusIcon, messagesEndRef, messageVariants, messageListVariants, activeChat }: any) => (
  <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-transparent to-gray-900/20">
    {isLoading ? (
      <div className="flex items-center justify-center h-full">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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
        className="flex flex-col items-center justify-between h-full text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div className="mb-6 p-4 bg-purple-600/20 rounded-full" whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-3">No messages yet</h3>
        <p className="text-gray-400 max-w-md text-lg">Start the conversation by sending your first message to {activeChat.name}</p>
      </motion.div>
    ) : (
      <motion.div 
        className="space-y-2 max-w-6xl mx-auto"
        variants={messageListVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg: Message) => (
            <motion.div
              key={msg.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} cursor-pointer` }
            >
              <motion.div 
                className={`relative max-w-xs md:max-w-md lg:max-w-lg group ${msg.sender === 'user' ? 'bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl rounded-br-lg border-purple-500/30' : 'bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl rounded-bl-lg border-gray-600/30'} p-2 shadow-xl border`}
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white leading-relaxed">{msg.text}</p>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700/80 rounded-3xl rounded-bl-lg p-4 border border-gray-600/30">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </motion.div>
    )}
  </div>
));

const MessageInput = React.memo(({ activeChat, inputMessage, setInputMessage, handleKeyDown, handleSendMessage, isSending, inputRef, buttonVariants }: any) => (
  <motion.div 
    className="p-4 bg-gray-800/80 border-t border-gray-700/50"
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <div className="flex items-end gap-3 max-w-6xl mx-auto">
      <div className="flex-1 relative">
        <motion.textarea
          ref={inputRef}
          placeholder={`Message ${activeChat?.name || ''}`}
          className="w-full py-4 px-6 bg-gray-700/50 cursor-pointer rounded-3xl text-white placeholder-gray-400 focus:bg-gray-600/50 border border-gray-600/30 max-h-32 min-h-[56px] resize-none"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          rows={1}
          style={{ height: 'auto', minHeight: '56px' }}
          onInput={(e: any) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
          transition={{ duration: 0.2 }}
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
        whileHover={inputMessage.trim() && !isSending ? 'hover' : undefined}
        whileTap={inputMessage.trim() && !isSending ? 'tap' : undefined}
        animate={inputMessage.trim() && !isSending ? 'active' : 'disabled'}
        className={`
          relative p-5 rounded-sm overflow-hidden
          ${inputMessage.trim() && !isSending 
            ? 'bg-gradient-to-br from-gray-900 via-purple-700 to-purple-600 text-white shadow-xl border-2 border-purple-500/50' 
            : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border-2 border-gray-700/30'
          }
          transition-all duration-300 transform-gpu
        `}
        onClick={handleSendMessage}
        disabled={!inputMessage.trim() || isSending}
      >
        {/* Pulsating Neon Border */}
        <motion.div
          className="absolute inset-0 border-2 border-transparent rounded-2xl"
          animate={inputMessage.trim() && !isSending ? {
            borderColor: ['rgba(147, 51, 234, 0.8)', 'rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.8)'],
            boxShadow: [
              '0 0 5px rgba(147, 51, 234, 0.5), 0 0 15px rgba(147, 51, 234, 0.3)',
              '0 0 15px rgba(147, 51, 234, 0.7), 0 0 25px rgba(147, 51, 234, 0.5)',
              '0 0 5px rgba(147, 51, 234, 0.5), 0 0 15px rgba(147, 51, 234, 0.3)',
            ],
          } : {}}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'loop' }}
        />
      
        {/* Particle Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          variants={{
            active: {
              transition: { staggerChildren: 0.1 },
            },
          }}
          animate={inputMessage.trim() && !isSending ? 'active' : undefined}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              variants={{
                active: {
                  x: [0, Math.random() * 20 - 10],
                  y: [0, Math.random() * 20 - 10],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                  transition: { duration: 1.5, repeat: Infinity, delay: i * 0.2 },
                },
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </motion.div>

        {isSending ? (
          <motion.div
            animate={{ 
              rotate: 360, 
              scale: [1, 1.3, 1],
              borderColor: ['rgba(255, 255, 255, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(255, 255, 255, 0.8)'],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-6 border-3 border-white border-t-purple-500 rounded-full"
          />
        ) : (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
              active: {
                // y: [0, -3, 0],
                // scale: [1, 1.2, 1],
                // transition: { duration: 0.6, repeat: Infinity, repeatType: 'loop' },
              },
              
            }}
            animate={inputMessage.trim() ? 'active' : undefined}
          >
            <path d="m22 2-7 20-4-9-9-4Z"/>
            <path d="m22 2-11 11"/>
            <motion.path
              d="M22 2h-2v2"
              stroke="currentColor"
              animate={inputMessage.trim() ? {
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.3, 1],
              } : { opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </motion.svg>
        )}
    </motion.button>
        </div>
      </motion.div>
    ));

export default ChatPage;