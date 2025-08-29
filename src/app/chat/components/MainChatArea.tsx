import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  id: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MainChatAreaProps {
  activeChat: User | null;
  setShowMobileSidebar: (show: boolean) => void;
  setShowStartChatModal: (show: boolean) => void;
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  isSending: boolean;
  statusColors: Record<string, string>;
  formatTime: (date: Date) => string;
  getMessageStatusColor: (status?: string) => string;
  getMessageStatusIcon: (status?: string) => string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export const MainChatArea: React.FC<MainChatAreaProps> = ({
  activeChat,
  setShowMobileSidebar,
  setShowStartChatModal,
  messages,
  isLoading,
  isTyping,
  inputMessage,
  setInputMessage,
  handleKeyDown,
  handleSendMessage,
  isSending,
  statusColors,
  formatTime,
  getMessageStatusColor,
  getMessageStatusIcon,
  messagesEndRef,
  inputRef
}) => {
  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Welcome to Chat</h2>
          <p className="text-gray-400 mb-6">Select a conversation or start a new one to begin chatting</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden px-6 py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-700 transition-all border border-gray-600/50"
            >
              View Conversations
            </button>
            <button
              onClick={() => setShowStartChatModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-purple-500/25"
            >
              Start New Chat
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-sm">
      {/* Chat Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          <div className="relative">
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              className="w-10 h-10 rounded-full"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors[activeChat.status]}`} />
          </div>
          
          <div>
            <h3 className="font-semibold text-white">{activeChat.name}</h3>
            <p className="text-xs text-gray-400">
              {isTyping ? 'Typing...' : activeChat.status === 'online' ? 'Online' : `Last seen ${activeChat.lastSeen && formatTime(activeChat.lastSeen)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                when: "beforeChildren",
                staggerChildren: 0.1,
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-800/80 text-white rounded-bl-sm border border-gray-700/50'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.sender === 'user' && (
                        <span className={getMessageStatusColor(message.status)}>
                          {message.status === 'sending' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-3 h-3 border border-current border-t-transparent rounded-full inline-block"
                            />
                          ) : (
                            getMessageStatusIcon(message.status)
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-bl-sm p-4 max-w-[70%]">
              <div className="flex space-x-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-md"
      >
        <div className="flex items-end gap-3">
          <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isSending}
              rows={1}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all ${
              inputMessage.trim() && !isSending
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/25'
                : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"/>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
