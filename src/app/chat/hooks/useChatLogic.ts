import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { chatApi } from '../api/chatApi';

export interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  typing?: boolean;
}

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  id: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export const useChatLogic = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
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

  const transformChatData = useCallback((chatData: any): User => {
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

  // API wrapper functions
  const getUserList = useCallback(async (): Promise<User[]> => {
    try {
      const data = await chatApi.getUserList();
      return data.map((user: any, index: number) => transformUserData(user, index));
    } catch (error) {
      handleApiError(error, 'fetch users');
      return [];
    }
  }, [transformUserData, handleApiError]);

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim()) return allUsers;
    try {
      const data = await chatApi.searchUsers(query);
      return data.map((user: any, index: number) => transformUserData(user, index));
    } catch (error) {
      return allUsers.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
    }
  }, [allUsers, transformUserData]);

  const getPrivateChats = useCallback(async (): Promise<User[]> => {
    try {
      const data = await chatApi.getPrivateChats();
      return data.map(transformChatData);
    } catch (error) {
      handleApiError(error, 'fetch chats');
      return [];
    }
  }, [transformChatData, handleApiError]);

  const getChatMessages = useCallback(async (chatId: string | number): Promise<Message[]> => {
    try {
      const data = await chatApi.getChatMessages(chatId);
      return data.map(transformMessageData);
    } catch (error) {
      handleApiError(error, 'fetch messages');
      return [];
    }
  }, [transformMessageData, handleApiError]);

  const sendMessageToChat = useCallback(async (message: string, chatId: string | number): Promise<boolean> => {
    try {
      await chatApi.sendMessage(message, chatId);
      return true;
    } catch (error) {
      handleApiError(error, 'send message');
      return false;
    }
  }, [handleApiError]);

  const markMessagesAsRead = useCallback(async (chatId: string | number): Promise<boolean> => {
    try {
      return await chatApi.markMessagesAsRead(chatId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, []);

  const createPrivateChat = useCallback(async (username: string) => {
    try {
      return await chatApi.createPrivateChat(username);
    } catch (error) {
      handleApiError(error, 'create chat');
      return null;
    }
  }, [handleApiError]);

  // Event handlers
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
    const newMessage: Message = { 
      text: messageText, 
      sender: 'user', 
      id: tempId, 
      timestamp: new Date(), 
      status: 'sending' 
    };
    
    setIsSending(true);
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    
    const success = await sendMessageToChat(messageText, activeChat.id);
    setMessages(prev => prev.map(msg => 
      msg.id === tempId ? { ...msg, status: success ? 'sent' : 'failed' } : msg
    ));
    
    if (success) {
      setTimeout(() => setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'delivered' } : msg
      )), 500);
      
      readTimeoutRef.current = setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'read' } : msg
        ));
      }, 1500);
    }
    
    setIsSending(false);
    inputRef.current?.focus();
  }, [inputMessage, activeChat, isSending, sendMessageToChat]);

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

  return {
    // State
    currentUser,
    showStartChatModal,
    setShowStartChatModal,
    showMobileSidebar,
    setShowMobileSidebar,
    newChatUsername,
    setNewChatUsername,
    searchQuery,
    setSearchQuery,
    activeChat,
    setActiveChat,
    inputMessage,
    setInputMessage,
    users,
    allUsers,
    messages,
    isLoading,
    isSending,
    isTyping,
    recentChats,
    userListError,
    apiError,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Handlers
    handleLogout,
    handleStartNewChat,
    handleSendMessage,
    
    // Helper functions for UI
    formatTime: (date: Date) => {
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    },
    
    getMessageStatusColor: (status?: string) => ({
      sending: 'text-gray-500',
      sent: 'text-gray-400',
      delivered: 'text-blue-400',
      read: 'text-green-400',
      failed: 'text-red-400'
    }[status || ''] || 'text-gray-400'),
    
    getMessageStatusIcon: (status?: string) => {
      if (status === 'sending') return null;
      return { sent: '✓', delivered: '✓✓', read: '✓✓', failed: "!" }[status || ''] || '';
    },

    statusColors: {
      online: 'bg-emerald-500 shadow-emerald-500/50',
      offline: 'bg-slate-500 shadow-slate-500/50',
      away: 'bg-amber-500 shadow-amber-500/50'
    }
  };
};