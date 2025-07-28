"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from "framer-motion";
import EnvironmentVariables from '@/config/config';

const ChatPage = () => {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ name?: string } | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [chatList, setChatList] = useState<string[]>([]);
    const [messages, setMessages] = useState<{text: string, sender: 'user' | 'bot', id: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);
    
    const messageVariants: Variants = useMemo(() => ({
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            x: 100,
            transition: { duration: 0.3 }
        }
    }), []);

    const chatItemVariants: Variants = useMemo(() => ({
        hidden: { opacity: 0, x: -20 },
        visible: (i: number = 0) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: 0.1 + i * 0.05,
                type: "spring" as const,
                stiffness: 300,
                damping: 20
            }
        }),
        hover: {
            scale: 1.02,
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.98 }
    }), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setUser({ name: 'John Doe' }); // hardcoded
                
                // Fetch chat list
        
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || EnvironmentVariables.BACKEND_URL}/v1/chatlist`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        'Authorization': 'Bearer', authToken: sessionStorage.getItem('authToken') || '' 
                    }
                    
                });
                if (!res.ok) throw new Error('Failed to fetch chat list');
                const data = await res.json();
                setChatList(Array.isArray(data.chats) ? data.chats : []);
            } catch (error) {
                console.error('Error fetching chat list:', error);
                setChatList([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        const getMessages = async () => {
            if (!activeChat) return;
            
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || EnvironmentVariables.BACKEND_URL}/v1/${activeChat}/messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch messages');
                const data = await res.json();
                const formattedMessages = Array.isArray(data.chats) ? 
                    data.chats.map((msg: string, i: number) => ({
                        text: msg,
                        sender: i % 2 === 0 ? 'user' : 'bot',
                        id: `msg-${Date.now()}-${i}`
                    })) : [];
                setMessages(formattedMessages);
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
            router.push('/');
            localStorage.removeItem('username');
            localStorage.removeItem('access_token');
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    }, [router]);

    const handleNewChat = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (newChatName.trim()) {
            setActiveChat(newChatName.trim());
            setShowNewChatModal(false);
            setNewChatName("");
        }
    }, [newChatName]);

    const handleSendMessage = useCallback(() => {
        if (inputMessage.trim()) {
            const newMessage = {
                text: inputMessage,
                sender: 'user' as const,
                id: `msg-${Date.now()}`
            };
            
            setMessages(prev => [...prev, newMessage]);
            setInputMessage("");
            
            // Simulate bot response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: `Reply to: ${inputMessage}`,
                    sender: 'bot' as const,
                    id: `msg-${Date.now()}-reply`
                }]);
            }, 1000);
        }
    }, [inputMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => { 
        if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim()) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [inputMessage, handleSendMessage]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            {/* Compact Logout Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="fixed top-3 right-3 z-50 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                title="Logout"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </motion.button>

            {/* Compact Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 flex flex-col border-r border-purple-700/30 shadow-xl"
                style={{ minWidth: 256 }}
            >
                <div className="mb-6 flex flex-col items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full border-2 border-purple-400/30 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-200">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold text-white tracking-wide">
                        Project Zero
                    </h1>
                    <p className="text-xs text-purple-300 font-medium">
                        Hi, <span className="font-bold text-white">{user.name}</span>
                    </p>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 px-3 mb-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 border border-purple-400/30 flex items-center justify-center gap-2 text-sm"
                    onClick={() => setShowNewChatModal(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Chat
                </motion.button>
                <div className="flex-1 overflow-y-auto pr-2">
                    <h2 className="text-sm font-semibold mb-5 text-purple-300 tracking-wide ml-10">
                        Contacts
                    </h2>
                    <div className="space-y-2">
                        {chatList.map((chat, i) => (
                            <motion.div
                                key={chat}
                                custom={i}
                                variants={chatItemVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                whileTap="tap"
                                className={`flex items-center p-2 rounded-lg ${activeChat === chat ? 'bg-purple-800/40' : 'bg-gray-800/80'} cursor-pointer shadow-md transition-all border border-purple-700/10`}
                                onClick={() => setActiveChat(chat)}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mr-3 shadow-lg border-2 border-purple-400/30 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white text-sm truncate">{chat}</p>
                                    <p className="text-xs text-purple-200/80">Click to chat</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border-2 border-purple-500/60 relative"
                        >
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-purple-400 text-2xl font-bold focus:outline-none transition-colors"
                                onClick={() => setShowNewChatModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                            <h3 className="text-xl font-bold text-purple-400 mb-6 text-center">
                                Start New Chat
                            </h3>
                            <form onSubmit={handleNewChat} className="flex flex-col gap-5">
                                <input
                                    type="text"
                                    className="w-full py-3 px-5 rounded-lg bg-gray-700 text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/40 border border-purple-400/20 shadow-inner text-base transition-all"
                                    placeholder="Enter contact name..."
                                    value={newChatName}
                                    onChange={e => setNewChatName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 border border-purple-400/30 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    Start Chat
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
                        <h2 className="text-3xl font-bold text-white mb-4 text-center">
                            Welcome to Project Zero Chat
                        </h2>
                        <p className="text-lg text-purple-300 mb-8 text-center max-w-lg">
                            Select a chat from the sidebar or create a new one to start messaging
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Compact Header */}
                        <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-3 border-b border-purple-700/30 flex items-center shadow-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full mr-3 shadow-lg border-2 border-purple-400/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    <span className="text-purple-400">{activeChat}</span>
                                </h2>
                                <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    Online
                                </p>
                            </div>
                        </header>

                        {/* Messages Area - Maximized */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    <AnimatePresence>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                variants={messageVariants}
                                                initial="hidden"
                                                animate="visible"   
                                                exit="exit"
                                                className={msg.sender === 'user' ? "flex justify-end" : "flex justify-start"}
                                            >
                                                <div className={`relative ${msg.sender === 'user' ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gray-700/80"} p-3 rounded-xl max-w-md shadow-md border ${msg.sender === 'user' ? "border-purple-700/20" : "border-purple-700/10"} text-white text-sm`}>
                                                    {msg.text}
                                                    <div className={`absolute bottom-0 ${msg.sender === 'user' ? "-right-1" : "-left-1"} w-3 h-3 ${msg.sender === 'user' ? "bg-indigo-600" : "bg-gray-700/80"} transform rotate-45`} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Compact Input Area */}
                        <div className="p-3 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-t border-purple-700/30 shadow-xl">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-700/80 rounded-full py-3 px-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm shadow-inner border border-purple-400/20 transition-all"
                                    value={inputMessage}
                                    onChange={e => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2.5 rounded-full hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <path d="m22 2-7 20-4-9-9-4Z"/>
                                        <path d="m22 2-11 11"/>
                                    </svg>
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