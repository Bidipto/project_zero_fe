"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from "framer-motion";
import EnvironmentVariables from '@/config/config';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  id: string;
  timestamp: Date;
}

const ChatPage = () => {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [currentUser, setCurrentUser] = useState<{ name: string; avatar?: string } | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim() === "") {
                setFilteredUsers(users);
            } else {
                setFilteredUsers(
                    users.filter(user => 
                        user.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, users]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Animation variants
    const messageVariants: Variants = useMemo(() => ({
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            x: 100,
            transition: { duration: 0.2 }
        }
    }), []);

    const chatItemVariants: Variants = useMemo(() => ({
        hidden: { opacity: 0, x: -20 },
        visible: (i: number = 0) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: 0.1 + i * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }),
        hover: {
            scale: 1.02,
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.98 }
    }), []);

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        away: 'bg-yellow-500'
    };

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const username = localStorage.getItem('username');
                setCurrentUser({ 
                    name: username,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8b5cf6&color=fff`
                });
                
                // Simulate fetching users (replace with actual API call)
                const mockUsers: User[] = [
                    { id: '1', name: 'Alex Johnson', status: 'online', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
                    { id: '2', name: 'Sarah Williams', status: 'away', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
                    { id: '3', name: 'Michael Brown', status: 'offline', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
                    { id: '4', name: 'Emily Davis', status: 'online', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
                    { id: '5', name: 'David Wilson', status: 'online', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
                ];

                setUsers(mockUsers);
                setFilteredUsers(mockUsers);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Fetch messages when active chat changes
    useEffect(() => {
        const getMessages = async () => {
            if (!activeChat) return;
            
            setIsLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                const mockMessages: Message[] = [
                    { text: 'Hey there!', sender: 'bot', id: '1', timestamp: new Date(Date.now() - 3600000) },
                    { text: 'Hi! How are you?', sender: 'user', id: '2', timestamp: new Date(Date.now() - 3500000) },
                    { text: "I'm doing well, thanks for asking! How about you?", sender: 'bot', id: '3', timestamp: new Date(Date.now() - 3400000) },
                    { text: "Pretty good! Just working on some projects.", sender: 'user', id: '4', timestamp: new Date(Date.now() - 3300000) },
                ];
                
                setMessages(mockMessages);

            } catch (error) {
                console.error('Error fetching messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        getMessages();
    }, [activeChat]);

    const handleLogout = useCallback(async () => {
        try {
            localStorage.removeItem('username');
            localStorage.removeItem('access_token');    
            router.push('/');
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    }, [router]);

    const handleSendMessage = useCallback(async () => {
        if (!inputMessage.trim() || !activeChat) return;
        
        const newMessage: Message = {
            text: inputMessage,
            sender: 'user',
            id: `msg-${Date.now()}`,
            timestamp: new Date()
        };
        
        setIsSending(true);
        setMessages(prev => [...prev, newMessage]);
        setInputMessage("");
        
        try {
            // Simulate API call and response
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const replyMessage: Message = {
                text: `Reply to: ${inputMessage}`,
                sender: 'bot',
                id: `msg-${Date.now()}-reply`,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, replyMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Show error to user
            const errorMessage: Message = {
                text: 'Failed to send message. Please try again.',
                sender: 'bot',
                id: `msg-${Date.now()}-error`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
            if (inputRef.current) inputRef.current.focus();
        }
    }, [inputMessage, activeChat]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => { 
        if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim()) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [inputMessage, handleSendMessage]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="hidden md:flex flex-col w-80 bg-gray-800 border-r border-gray-700"
            >
                {/* User profile header */}
                <div className="p-4 flex items-center gap-3 bg-gray-800 border-b border-gray-700">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                    >
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-400">Online</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLogout}
                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        title="Logout"
                        aria-label="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </motion.button>
                </div>

                {/* Search bar */}
                <div className="p-3 border-b border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full py-2 pl-10 pr-4 bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 text-gray-400">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </div>
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</h3>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                            />
                        </div>
                    ) : (
                        <motion.ul className="space-y-1 px-2">
                            {filteredUsers.map((user, i) => (
                                <motion.li
                                    key={user.id}
                                    custom={i}
                                    variants={chatItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    whileTap="tap"
                                    className={`flex items-center p-3 rounded-lg cursor-pointer ${activeChat?.id === user.id ? 'bg-purple-900/30' : 'hover:bg-gray-700/50'}`}
                                    onClick={() => setActiveChat(user)}
                                >
                                    <div className="relative mr-3">
                                        <img 
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff`} 
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${statusColors[user.status]}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {user.status === 'online' ? 'Online' : 
                                             user.status === 'away' ? 'Away' : 'Offline'}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </div>
            </motion.div>

            {/* Mobile sidebar toggle */}
            <button 
                className="md:hidden fixed bottom-4 left-4 z-20 p-3 bg-purple-600 rounded-full shadow-lg"
                onClick={() => setShowNewChatModal(true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>

            {/* Mobile sidebar modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 bg-black bg-opacity-70 md:hidden"
                        onClick={() => setShowNewChatModal(false)}
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="h-full w-4/5 max-w-sm bg-gray-800 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Mobile sidebar content */}
                            <div className="p-4 flex items-center gap-3 bg-gray-800 border-b border-gray-700">
                                <img 
                                    src={currentUser.avatar} 
                                    alt={currentUser.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{currentUser.name}</p>
                                    <p className="text-xs text-gray-400">Online</p>
                                </div>
                                <button
                                    onClick={() => setShowNewChatModal(false)}
                                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>

                            <div className="p-3 border-b border-gray-700">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        className="w-full py-2 pl-10 pr-4 bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 text-gray-400">
                                        <circle cx="11" cy="11" r="8"/>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                </div>
                            </div>

                            <div className="h-[calc(100%-120px)] overflow-y-auto">
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</h3>
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                                        />
                                    </div>
                                ) : (
                                    <ul className="space-y-1 px-2">
                                        {filteredUsers.map((user) => (
                                            <motion.li
                                                key={user.id}
                                                whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`flex items-center p-3 rounded-lg cursor-pointer ${activeChat?.id === user.id ? 'bg-purple-900/30' : 'hover:bg-gray-700/50'}`}
                                                onClick={() => {
                                                    setActiveChat(user);
                                                    setShowNewChatModal(false);
                                                }}
                                            >
                                                <div className="relative mr-3">
                                                    <img 
                                                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff`} 
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${statusColors[user.status]}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {user.status === 'online' ? 'Online' : 
                                                         user.status === 'away' ? 'Away' : 'Offline'}
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

            {/* Main chat area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-6 p-4 bg-gray-800 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </motion.div>
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            Welcome to ChatApp
                        </motion.h2>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-400 mb-6 max-w-md"
                        >
                            Select a contact from the sidebar to start chatting or search for a user to connect with.
                        </motion.p>
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="md:hidden px-6 py-2 bg-purple-600 rounded-full font-medium shadow-lg"
                            onClick={() => setShowNewChatModal(true)}
                        >
                            Browse Contacts
                        </motion.button>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <header className="p-3 bg-gray-800 border-b border-gray-700 flex items-center">
                            <button 
                                className="md:hidden mr-3 p-1 rounded-full hover:bg-gray-700 transition-colors"
                                onClick={() => setShowNewChatModal(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"/>
                                    <line x1="3" y1="6" x2="21" y2="6"/>
                                    <line x1="3" y1="18" x2="21" y2="18"/>
                                </svg>
                            </button>
                            <div className="relative mr-3">
                                <img 
                                    src={activeChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name)}&background=8b5cf6&color=fff`} 
                                    alt={activeChat.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${statusColors[activeChat.status]}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold truncate">{activeChat.name}</h2>
                                <p className="text-xs text-gray-400">
                                    {activeChat.status === 'online' ? 'Online' : 
                                     activeChat.status === 'away' ? 'Away' : 'Offline'}
                                </p>
                            </div>
                        </header>

                        {/* Messages area */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                                    />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 mb-4">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
                                    <p className="text-gray-400 max-w-md">Start the conversation by sending your first message to {activeChat.name}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                variants={messageVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`relative max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 ${msg.sender === 'user' ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                                                    <p className="text-white">{msg.text}</p>
                                                    <p className="text-xs mt-1 text-right opacity-70">
                                                        {formatTime(msg.timestamp)}
                                                    </p>
                                                    <div className={`absolute bottom-0 ${msg.sender === 'user' ? '-right-1' : '-left-1'} w-3 h-3 ${msg.sender === 'user' ? 'bg-purple-600' : 'bg-gray-700'} transform rotate-45`} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Message input */}
                        <div className="p-3 bg-gray-800 border-t border-gray-700">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={`Message ${activeChat?.name || ''}...`}
                                    className="flex-1 py-3 px-4 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600 transition-all"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSending}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isSending}
                                >
                                    {isSending ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m22 2-7 20-4-9-9-4Z"/>
                                            <path d="m22 2-11 11"/>
                                        </svg>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ChatPage;