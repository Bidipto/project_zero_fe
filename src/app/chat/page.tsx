"use client";
import React from 'react';
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatLogic } from './hooks/useChatLogic';
import { Sidebar } from './components/Sidebar';
import { MobileSidebar } from './components/MobileSidebar';
import { StartChatModal } from './components/StartChatModal';
import { MainChatArea } from './components/MainChatArea';

const ChatPage = () => {
  const {
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
    messages,
    isLoading,
    isSending,
    isTyping,
    recentChats,
    userListError,
    apiError,
    messagesEndRef,
    inputRef,
    handleLogout,
    handleStartNewChat,
    handleSendMessage,
    formatTime,
    getMessageStatusColor,
    getMessageStatusIcon,
    statusColors
  } = useChatLogic();


  // updated this code as per the use cases of composition events in different browsers and IMEs (eg. chjinese, japanese, korean etc.)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e as any).isComposing || (e.nativeEvent as any).isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim() && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [inputMessage, isSending, handleSendMessage]);

  const handleCreateNewChatFromModal = async () => {
    if (!newChatUsername.trim()) return;
    await handleStartNewChat({ 
      id: Date.now(), 
      name: newChatUsername, 
      status: 'offline' as const 
    });
    setNewChatUsername("");
  };

  const handleKeyDownNewChat = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newChatUsername.trim()) {
      e.preventDefault();
      handleCreateNewChatFromModal();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" }, 
              scale: { duration: 1, repeat: Infinity } 
            }}
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
      />
    </div>
  );
};

export default ChatPage;