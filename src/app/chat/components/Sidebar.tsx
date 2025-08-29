import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface SidebarProps {
  currentUser: { name: string; avatar?: string } | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentChats: User[];
  activeChat: User | null;
  setActiveChat: (chat: User) => void;
  setShowStartChatModal: (show: boolean) => void;
  handleLogout: () => void;
  statusColors: Record<string, string>;
  formatTime: (date: Date) => string;
  userListError: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  searchQuery,
  setSearchQuery,
  recentChats,
  activeChat,
  setActiveChat,
  setShowStartChatModal,
  handleLogout,
  statusColors,
  formatTime,
  userListError
}) => {
  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="hidden md:flex w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-full ring-2 ring-purple-500/50"
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors.online}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{currentUser?.name}</h3>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => setShowStartChatModal(true)}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
        >
          + New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {userListError ? (
          <div className="p-4 text-center">
            <p className="text-red-400 text-sm">{userListError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {recentChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  transition: { 
                    delay: 0.05 + index * 0.03, 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 20 
                  } 
                }}
                whileHover={{ scale: 1.02, x: 5, backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-800/50 transition-all ${
                  activeChat?.id === chat.id 
                    ? 'bg-purple-500/20 border-purple-500/30' 
                    : 'hover:bg-gray-800/30'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors[chat.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white truncate">{chat.name}</h4>
                    <span className="text-xs text-gray-400">
                      {chat.lastSeen && formatTime(chat.lastSeen)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {chat.status === 'online' ? 'Online' : `Last seen ${chat.lastSeen && formatTime(chat.lastSeen)}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {recentChats.length === 0 && !userListError && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">No conversations yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start a new conversation to get chatting</p>
            <button
              onClick={() => setShowStartChatModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Chatting
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
