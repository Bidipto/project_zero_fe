"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ChatPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<{ name?: string } | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [activeChat, setActiveChat] = useState<string>("Contact 1");

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = { name: 'John Doe' };
            setUser(currentUser);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            router.push('/');
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    const handleNewChat = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveChat(newChatName); // Set the new chat as active
        setShowNewChatModal(false);
        setNewChatName("");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden relative">
            {/* Logout button top right */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 8, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }}
                whileTap={{ scale: 0.95, rotate: -8 }}
                onClick={handleLogout}
                className="fixed top-6 right-8 z-50 py-2 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-2xl hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50 border-2 border-purple-400/40 backdrop-blur-lg"
                style={{ boxShadow: '0 8px 32px 0 rgba(168,85,247,0.25)' }}
            >
                Logout
            </motion.button>

            {/* Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "backOut" }}
                className="w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 flex flex-col border-r border-purple-700/30 shadow-2xl relative"
                style={{ minWidth: 320 }}
            >
                <div className="mb-8 flex flex-col items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                        className="p-3 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full border-4 border-purple-400/30 shadow-xl"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-200">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </motion.div>
                    <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow-lg">Project Zero Chat</h1>
                    <p className="text-sm text-purple-300 font-medium">Welcome, <span className="font-bold text-white">{user.name}</span></p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05, background: 'linear-gradient(90deg, #a855f7, #6366f1)', boxShadow: '0 4px 24px 0 rgba(168,85,247,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 px-4 mb-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 border border-purple-400/30"
                    onClick={() => setShowNewChatModal(true)}
                >
                    + New Chat
                </motion.button>
                <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                    <h2 className="text-lg font-semibold mb-4 text-purple-300 tracking-wide">Contacts</h2>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } }
                        }}
                        className="space-y-2"
                    >
                        {[...Array(10)].map((_, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.03, backgroundColor: '#a855f733' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center p-3 rounded-xl bg-gray-800/80 hover:bg-purple-800/30 cursor-pointer shadow-md transition-all border border-purple-700/10"
                                onClick={() => setActiveChat(`Contact ${i + 1}`)}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mr-3 shadow-lg border-2 border-purple-400/30"></div>
                                <div>
                                    <p className="font-semibold text-white">Contact {i + 1}</p>
                                    <p className="text-xs text-purple-200/80">Last message...</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, type: 'spring', bounce: 0.4 }}
                        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border-2 border-purple-500/60 relative"
                    >
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-purple-400 text-2xl font-bold focus:outline-none transition-colors"
                            onClick={() => setShowNewChatModal(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h3 className="text-xl font-bold text-purple-400 mb-6 text-center drop-shadow">Start New Chat</h3>
                        <form onSubmit={handleNewChat} className="flex flex-col gap-5">
                            <input
                                type="text"
                                className="w-full py-3 px-5 rounded-lg bg-gray-700 text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/40 border border-purple-400/20 shadow-inner text-base transition-all"
                                placeholder="Enter contact name..."
                                value={newChatName}
                                onChange={e => setNewChatName(e.target.value)}
                                required
                            />
                            <motion.button
                                whileHover={{ scale: 1.04, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 border border-purple-400/30"
                            >
                                Start Chat
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <motion.header
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, type: 'spring', bounce: 0.3 }}
                    className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-6 border-b border-purple-700/30 flex items-center shadow-lg"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-full mr-5 shadow-lg border-2 border-purple-400/30 animate-pulse"></div>
                    <div>
                        <h2 className="text-2xl font-bold text-white drop-shadow">Chat with <span className="text-purple-400">{activeChat}</span></h2>
                        <p className="text-sm text-green-400 font-semibold animate-pulse">Online</p>
                    </div>
                </motion.header>

                <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 scrollbar-hide hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Placeholder messages */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } }
                        }}
                        className="space-y-6"
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } }}
                            className="flex justify-start"
                        >
                            <div className="bg-gray-700/80 p-4 rounded-2xl max-w-lg shadow-md border border-purple-700/10 text-white text-base">
                                Hey! How's it going?
                            </div>
                        </motion.div>
                        <motion.div
                            variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}
                            className="flex justify-end"
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl max-w-lg shadow-lg border border-purple-700/20 text-white text-base">
                                Pretty good! Just working on this chat app. It's looking great.
                            </div>
                        </motion.div>
                        <motion.div
                            variants={{ hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } }}
                            className="flex justify-start"
                        >
                            <div className="bg-gray-700/80 p-4 rounded-2xl max-w-lg shadow-md border border-purple-700/10 text-white text-base">
                                That's awesome! The animations are slick.
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3, type: 'spring', bounce: 0.3 }}
                    className="p-6 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-t border-purple-700/30 shadow-xl"
                >
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="w-full bg-gray-700/80 rounded-full py-4 px-8 pr-20 text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/30 text-base shadow-inner border border-purple-400/20 transition-all"
                            style={{ boxShadow: '0 2px 16px 0 rgba(168,85,247,0.10)' }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.1, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg border border-purple-400/30"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
                        </motion.button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default ChatPage;