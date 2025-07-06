"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from "framer-motion";


const ChatPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<{ name?: string } | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [chatList, setChatList] = useState<string[]>([]);
    const [messages, setMessages] = useState<{text: string, sender: 'user' | 'bot', id: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Floating bubbles animation variants
    const floatingBubbles = Array(18).fill(0).map((_, i) => ({
        id: `bubble-${i}`,
        initialX: Math.sin(i) * 60,
        initialY: Math.cos(i) * 24,
        size: 14 + (i % 3) * 4,
        delay: i * 0.12,
        duration: 3.5 + (i % 3) * 0.7
    }));

    // Message bubble animation variants
    const messageVariants = {
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
            transition: { duration: 0.3 }
        }
    };

    // Chat list item animation
    const chatItemVariants: Variants = {
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
            scale: 1.03,
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.98 }
    };

    useEffect(() => {
        const fetchData = async () => {
            // Simulate loading user with shimmer effect
            await new Promise(resolve => setTimeout(resolve, 800));
            setUser({ name: 'John Doe' });
            
            // Simulate loading chat list
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/v1/chatlist`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch chat list');
                const data = await res.json();
                setChatList(Array.isArray(data.chats) ? data.chats : []);
            } catch (error) {
                console.error('Error fetching chat list:', error);
                setChatList([]);
            }
            
            setIsLoading(false);
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        const getMessages = async () => {
            if (!activeChat) return;
            
            setIsLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/v1/${activeChat}/messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch messages');
                const data = await res.json();
                // Transform messages to include sender and unique ID
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
            }
            setIsLoading(false);
        };
        
        getMessages();
    }, [activeChat]);

    const handleLogout = async () => {
        // Add exit animation before logout
        document.body.style.overflow = 'hidden';
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
            await router.push('/');
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    const handleNewChat = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveChat(newChatName);
        setShowNewChatModal(false);
        setNewChatName("");
    };

    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            const newMessage = {
                text: inputMessage,
                sender: 'user' as const,
                id: `msg-${Date.now()}`
            };
            
            setMessages(prev => [...prev, newMessage]);
            setInputMessage("");
            
            // Add a simulated response after 1 second
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: `Reply to: ${inputMessage}`,
                    sender: 'bot' as const,
                    id: `msg-${Date.now()}-reply`
                }]);
            }, 1000 + Math.random() * 500); // Add slight delay variation for more natural feel
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.2, 1],
                        opacity: 1
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full relative"
                >
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-300"
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2
                        }}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden relative"
        >
            {/* Logout button with enhanced animation */}
            <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.5 }
                }}
                whileHover={{ 
                    scale: 1.1,
                    background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="fixed top-6 right-8 z-50 py-2 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-2xl hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50 border-2 border-purple-400/40 backdrop-blur-lg flex items-center gap-2"
                style={{ boxShadow: '0 8px 32px 0 rgba(168,85,247,0.25)' }}
            >
                <motion.span
                    animate={{
                        rotate: 360,
                        transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                </motion.span>
                Logout
            </motion.button>

            {/* Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ 
                    x: 0, 
                    opacity: 1,
                    transition: { 
                        duration: 0.7, 
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.3
                    }
                }}
                exit={{ x: -100, opacity: 0 }}
                className="w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 flex flex-col border-r border-purple-700/30 shadow-2xl relative z-40"
                style={{ minWidth: 320 }}
            >
                <div className="mb-8 flex flex-col items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                            scale: 1, 
                            opacity: 1,
                            transition: { 
                                delay: 0.4, 
                                duration: 0.5, 
                                type: 'spring', 
                                stiffness: 200 
                            }
                        }}
                        className="p-3 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full border-4 border-purple-400/30 shadow-xl relative overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: [0, 0.3, 0],
                                transition: {
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }
                            }}
                            className="absolute inset-0 bg-white/10"
                            style={{
                                clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)'
                            }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-200 relative z-10">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { delay: 0.5 }
                        }}
                        className="text-2xl font-extrabold text-white tracking-wide drop-shadow-lg"
                    >
                        Project Zero Chat
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ 
                            opacity: 1,
                            transition: { delay: 0.6 }
                        }}
                        className="text-sm text-purple-300 font-medium"
                    >
                        Welcome, <span className="font-bold text-white">{user.name}</span>
                    </motion.p>
                </div>
                
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: 0.7 }
                    }}
                    whileHover={{ 
                        scale: 1.05, 
                        background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                        boxShadow: '0 4px 24px 0 rgba(168,85,247,0.4)'
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 px-4 mb-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 border border-purple-400/30 flex items-center justify-center gap-2"
                    onClick={() => setShowNewChatModal(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Chat
                </motion.button>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { delay: 0.8 }
                        }}
                        className="text-lg font-semibold mb-4 text-purple-300 tracking-wide"
                    >
                        Contacts
                    </motion.h2>
                    
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        className="space-y-2"
                    >
                        {chatList.map((chat, i) => (
                            <motion.div
                                key={chat}
                                custom={i}
                                variants={chatItemVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                whileTap="tap"
                                className={`flex items-center p-3 rounded-xl ${activeChat === chat ? 'bg-purple-800/40' : 'bg-gray-800/80'} cursor-pointer shadow-md transition-all border border-purple-700/10`}
                                onClick={() => setActiveChat(chat)}
                            >
                                <motion.div 
                                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mr-3 shadow-lg border-2 border-purple-400/30 flex items-center justify-center"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                </motion.div>
                                <div>
                                    <p className="font-semibold text-white">{chat}</p>
                                    <p className="text-xs text-purple-200/80">Click to chat...</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
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
                            animate={{ 
                                scale: 1, 
                                opacity: 1, 
                                y: 0,
                                transition: { 
                                    duration: 0.3, 
                                    type: 'spring', 
                                    bounce: 0.4 
                                }
                            }}
                            exit={{ 
                                scale: 0.8, 
                                opacity: 0, 
                                y: 20,
                                transition: { duration: 0.2 }
                            }}
                            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border-2 border-purple-500/60 relative"
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, color: '#a855f7' }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-3 right-3 text-gray-400 hover:text-purple-400 text-2xl font-bold focus:outline-none transition-colors"
                                onClick={() => setShowNewChatModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </motion.button>
                            <motion.h3 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    transition: { delay: 0.1 }
                                }}
                                className="text-xl font-bold text-purple-400 mb-6 text-center drop-shadow"
                            >
                                Start New Chat
                            </motion.h3>
                            <form onSubmit={handleNewChat} className="flex flex-col gap-5">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        transition: { delay: 0.2 }
                                    }}
                                >
                                    <input
                                        type="text"
                                        className="w-full py-3 px-5 rounded-lg bg-gray-700 text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/40 border border-purple-400/20 shadow-inner text-base transition-all"
                                        placeholder="Enter contact name..."
                                        value={newChatName}
                                        onChange={e => setNewChatName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </motion.div>
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        transition: { delay: 0.3 }
                                    }}
                                    whileHover={{ 
                                        scale: 1.04, 
                                        background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                                        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
                                    }}
                                    whileTap={{ scale: 0.97 }}
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
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ 
                            opacity: 1,
                            transition: { delay: 0.7 }
                        }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8"
                    >
                        {/* Enhanced floating animation */}
                        <div className="mb-8 relative w-64 h-32 flex items-center justify-center">
                            {floatingBubbles.map((bubble) => (
                                <motion.div
                                    key={bubble.id}
                                    initial={{
                                        x: bubble.initialX,
                                        y: bubble.initialY,
                                        opacity: 0.7,
                                        borderRadius: 4
                                    }}
                                    animate={{
                                        x: [bubble.initialX, bubble.initialX * 1.2, bubble.initialX],
                                        y: [bubble.initialY, bubble.initialY * 1.3, bubble.initialY],
                                        opacity: [0.7, 1, 0.7],
                                        borderRadius: [4, 12, 4],
                                        backgroundColor: [
                                            'rgba(168, 85, 247, 0.8)',
                                            'rgba(99, 102, 241, 0.8)',
                                            'rgba(168, 85, 247, 0.8)'
                                        ]
                                    }}
                                    transition={{
                                        duration: bubble.duration,
                                        repeat: Infinity,
                                        repeatType: 'loop',
                                        delay: bubble.delay,
                                        ease: 'easeInOut'
                                    }}
                                    className="absolute"
                                    style={{
                                        width: bubble.size,
                                        height: bubble.size,
                                        filter: 'blur(1.5px)',
                                        boxShadow: '0 2px 12px 0 rgba(168,85,247,0.15)'
                                    }}
                                />
                            ))}
                        </div>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { delay: 0.8 }
                            }}
                            className="text-3xl font-bold text-white mb-4 text-center"
                        >
                            Welcome to Project Zero Chat
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { delay: 0.9 }
                            }}
                            className="text-lg text-purple-300 mb-8 text-center max-w-lg"
                        >
                            Select a chat from the sidebar or create a new one to start messaging
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                transition: { delay: 1.1 }
                            }}
                            className="flex gap-2"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -5, 0],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                                className="w-3 h-3 bg-purple-500 rounded-full"
                            />
                            <motion.div
                                animate={{
                                    y: [0, -5, 0],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.2
                                    }
                                }}
                                className="w-3 h-3 bg-indigo-500 rounded-full"
                            />
                            <motion.div
                                animate={{
                                    y: [0, -5, 0],
                                    transition: {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.4
                                    }
                                }}
                                className="w-3 h-3 bg-purple-400 rounded-full"
                            />
                        </motion.div>
                    </motion.div>
                ) : (
                    <>
                        <motion.header
                            initial={{ opacity: 0, y: -40 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { 
                                    duration: 0.7, 
                                    type: 'spring', 
                                    bounce: 0.3 
                                }
                            }}
                            className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-6 border-b border-purple-700/30 flex items-center shadow-lg"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-14 h-14 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full mr-5 shadow-lg border-2 border-purple-400/30 flex items-center justify-center relative overflow-hidden"
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ 
                                        opacity: [0, 0.3, 0],
                                        transition: {
                                            duration: 3,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }
                                    }}
                                    className="absolute inset-0 bg-white/20"
                                    style={{
                                        clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)'
                                    }}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </motion.div>
                            <div>
                                <motion.h2 
                                    initial={{ opacity: 0 }}
                                    animate={{ 
                                        opacity: 1,
                                        transition: { delay: 0.2 }
                                    }}
                                    className="text-2xl font-bold text-white drop-shadow"
                                >
                                    Chat with <span className="text-purple-400">{activeChat}</span>
                                </motion.h2>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ 
                                        opacity: 1,
                                        transition: { delay: 0.3 }
                                    }}
                                    className="text-sm text-green-400 font-semibold flex items-center gap-1"
                                >
                                    <motion.span
                                        animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [0.6, 1, 0.6]
                                        }}
                                        transition={{ 
                                            duration: 1.5,
                                            repeat: Infinity
                                        }}
                                        className="inline-block w-2 h-2 bg-green-400 rounded-full"
                                    />
                                    Online
                                </motion.p>
                            </div>
                        </motion.header>

                        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <motion.div
                                        animate={{ 
                                            rotate: 360,
                                            scale: [1, 1.2, 1]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full relative"
                                    >
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-4 border-transparent border-l-purple-300"
                                            animate={{ rotate: -360 }}
                                            transition={{
                                                duration: 1.2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: 0.3
                                            }}
                                        />
                                    </motion.div>
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0, y: 30 },
                                        visible: { 
                                            opacity: 1, 
                                            y: 0, 
                                            transition: { 
                                                staggerChildren: 0.12,
                                                delayChildren: 0.2
                                            } 
                                        }
                                    }}
                                    className="space-y-6"
                                >
                                    <AnimatePresence>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                variants={messageVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                className={msg.sender === 'user' ? "flex justify-end" : "flex justify-start"}
                                                layout
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`relative ${msg.sender === 'user' ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gray-700/80"} p-4 rounded-2xl max-w-lg shadow-md border ${msg.sender === 'user' ? "border-purple-700/20" : "border-purple-700/10"} text-white text-base`}
                                                >
                                                    {msg.text}
                                                    <motion.div 
                                                        className={`absolute bottom-0 ${msg.sender === 'user' ? "-right-1" : "-left-1"} w-3 h-3 ${msg.sender === 'user' ? "bg-indigo-600" : "bg-gray-700/80"} transform rotate-45`}
                                                    />
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { 
                                    duration: 0.7, 
                                    delay: 0.3, 
                                    type: 'spring', 
                                    bounce: 0.3 
                                }
                            }}
                            className="p-6 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-t border-purple-700/30 shadow-xl"
                        >
                            <div className="relative">
                                <motion.input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-700/80 rounded-full py-4 px-8 pr-20 text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/30 text-base shadow-inner border border-purple-400/20 transition-all"
                                    style={{ boxShadow: '0 2px 16px 0 rgba(168,85,247,0.10)' }}
                                    value={inputMessage}
                                    onChange={e => setInputMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && inputMessage.trim()) {
                                            handleSendMessage();
                                        }
                                    }}
                                    whileFocus={{ 
                                        boxShadow: '0 2px 20px 0 rgba(168,85,247,0.25)',
                                        borderColor: 'rgba(168, 85, 247, 0.5)'
                                    }}
                                />
                                <motion.button
                                    whileHover={{ 
                                        scale: 1.1, 
                                        background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                                        boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg border border-purple-400/30"
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim()}
                                >
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
                                        className="text-white"
                                        animate={{
                                            x: [0, 2, 0],
                                            transition: {
                                                duration: 1.5,
                                                repeat: Infinity
                                            }
                                        }}
                                    >
                                        <path d="m22 2-7 20-4-9-9-4Z"/>
                                        <path d="m22 2-11 11"/>
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </main>

            {/* Global CSS to hide scrollbars */}
            <style jsx global>{`
              ::-webkit-scrollbar { display: none; }
              html { scrollbar-width: none; -ms-overflow-style: none; }
              body { overflow-x: hidden; }
            `}</style>
        </motion.div>
    );
};

export default ChatPage;