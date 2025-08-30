import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface StartChatModalProps {
  showStartChatModal: boolean;
  setShowStartChatModal: (show: boolean) => void;
  newChatUsername: string;
  setNewChatUsername: (username: string) => void;
  users: User[];
  handleStartNewChat: (user: User) => void;
  handleCreateNewChatFromModal: () => void;
  handleKeyDownNewChat: (e: React.KeyboardEvent) => void;
  statusColors: Record<string, string>;
  formatTime: (date: Date) => string;
}

export const StartChatModal: React.FC<StartChatModalProps> = ({
  showStartChatModal,
  setShowStartChatModal,
  newChatUsername,
  setNewChatUsername,
  users,
  handleStartNewChat,
  handleCreateNewChatFromModal,
  handleKeyDownNewChat,
  statusColors,
  formatTime
}) => {
  return (
    <AnimatePresence>
      {showStartChatModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStartChatModal(false)}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Start New Chat</h2>
                  <button
                    onClick={() => setShowStartChatModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter username to start chat..."
                    value={newChatUsername}
                    onChange={(e) => setNewChatUsername(e.target.value)}
                    onKeyDown={handleKeyDownNewChat}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
                {newChatUsername.trim() && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleCreateNewChatFromModal}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    Start Chat with "{newChatUsername}"
                  </motion.button>
                )}
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto">
                {users.length > 0 ? (
                  <div className="p-2">
                    <h3 className="text-sm font-medium text-gray-400 px-4 py-2">Available Users</h3>
                    <AnimatePresence>
                      {users.map((user, index) => (
                        <motion.div
                          key={`${user.id}-${index}`}
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
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                          onClick={() => handleStartNewChat(user)}
                          className="flex items-center gap-3 p-4 m-2 cursor-pointer rounded-xl hover:bg-gray-800/30 transition-all"
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors[user.status]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white truncate">{user.name}</h4>
                              <span className="text-xs text-gray-400 capitalize">{user.status}</span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {user.status === 'online' ? 'Active now' : user.lastSeen ?  `Last seen ${formatTime(user.lastSeen)}` : 'Offline'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-medium mb-2">No users found</h3>
                    <p className="text-gray-400 text-sm">
                      {newChatUsername.trim() 
                        ? 'Try searching for a different username' 
                        : 'Enter a username above to search for users'
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
