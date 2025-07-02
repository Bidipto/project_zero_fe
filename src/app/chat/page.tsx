"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ChatPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<{ name?: string } | null>(null);

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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <motion.div 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-80 bg-gray-800 p-4 flex flex-col border-r border-gray-700"
            >
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-purple-400">Project Zero Chat</h1>
                    <p className="text-sm text-gray-400">Welcome, {user.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-3 text-gray-300">Contacts</h2>                    
                    {[...Array(10)].map((_, i) => ( // Implement 
                        <div key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer mb-2">
                            <div className="w-10 h-10 bg-purple-500 rounded-full mr-3"></div>
                            <div>
                                <p className="font-semibold">Contact {i + 1}</p>
                                <p className="text-xs text-gray-400">Last message...</p>
                            </div>
                        </div>
                    ))}
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="w-full py-2 px-4 mt-4 rounded-lg bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700 transition-all"
                >
                    Logout
                </motion.button>
            </motion.div>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                <motion.header 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-gray-800 p-4 border-b border-gray-700 flex items-center"
                >
                    <div className="w-12 h-12 bg-gray-700 rounded-full mr-4"></div>
                    <div>
                        <h2 className="text-xl font-bold">Chat with Contact 1</h2>
                        <p className="text-sm text-green-400">Online</p>
                    </div>
                </motion.header>

                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Placeholder messages */}
                    <div className="space-y-4">
                        <div className="flex justify-start">
                            <div className="bg-gray-700 p-3 rounded-lg max-w-lg">
                                Hey! How's it going?
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="bg-purple-600 p-3 rounded-lg max-w-lg">
                                Pretty good! Just working on this chat app. It's looking great.
                            </div>
                        </div>
                         <div className="flex justify-start">
                            <div className="bg-gray-700 p-3 rounded-lg max-w-lg">
                                That's awesome! The animations are slick.
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="p-4 bg-gray-800 border-t border-gray-700"
                >
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="w-full bg-gray-700 rounded-full py-3 px-6 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 p-2 rounded-full hover:bg-purple-700 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default ChatPage;