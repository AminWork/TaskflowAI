import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Users, X, MessageCircle, Plus, Search, Hash, Settings, Smile, MoreVertical } from 'lucide-react';
import { ChatMessage, ChatMember, KanbanBoard, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageBubble } from './Chat/MessageBubble';
import { MembersList } from './Chat/MembersList';
import { UserSearch } from './Chat/UserSearch';
import { normalizeChatMessage, normalizeChatMember } from '../utils/normalize';

interface ChatPageProps {
  board: KanbanBoard;
  currentUser: User;
}

export function ChatPage({ board, currentUser }: ChatPageProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert user ID to string for compatibility
  const currentUserId = String(currentUser.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (board) {
      loadMessages();
      loadMembers();
      loadConversations();
      
      const interval = setInterval(() => {
        loadMessages();
        loadMembers();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [board]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}/chat/messages`);
      if (response.ok) {
        const data = await response.json();
        const normalizedMessages = data.map(normalizeChatMessage);
        setMessages(normalizedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}/chat/members`);
      if (response.ok) {
        const data = await response.json();
        const normalizedMembers = data.map(normalizeChatMember);
        setMembers(normalizedMembers);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isLoading) return;

    // Message data will be sent via formData
    
    const formData = new FormData();
    formData.append('boardId', board.id);
    formData.append('userId', currentUserId);
    formData.append('content', newMessage);
    formData.append('sender', 'user');
    formData.append('userName', currentUser.name);
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${board.id}/chat/messages`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, normalizeChatMessage(newMsg)]);
        setNewMessage('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/boards/${board.id}/chat/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId: string) => {
    if (String(userId) === String(currentUser.id)) {
      return true; // Always show self as online
    }
    const member = members.find(m => m.userId === userId);
    return member?.isOnline || false;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage().catch(console.error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage().catch(console.error);
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Left Sidebar - Channels/Conversations */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{board.title}</span>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('chat.searchChannels')}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {/* Current Channel */}
            <div className="mb-2">
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md flex items-center space-x-2 cursor-pointer">
                <Hash className="w-4 h-4" />
                <span className="text-sm font-medium truncate">{board.title}</span>
              </div>
            </div>
            
            {/* Conversations */}
            <div className="mb-4">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('chat.conversations')}
              </div>
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('chat.noConversations')}
                  </div>
                ) : (
                  conversations.map((conversation, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2 cursor-pointer group transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {conversation.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{conversation.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {currentUser.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-green-500 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{board.title}</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{members.length} members</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={t('chat.addMembers')}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={t('chat.showMembers')}
            >
              <Users className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

          {/* Messages Area */}
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 transition-colors duration-300">
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-xl font-medium mb-2">{t('chat.noMessages')}</p>
                    <p className="text-sm text-center">{t('chat.startConversation')}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div key={message.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-4 px-4 py-2 transition-colors">
                        <MessageBubble
                          message={message}
                          currentUser={currentUser}
                          onDelete={deleteMessage}
                          isOnline={isUserOnline(message.userId)}
                        />
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedFile}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('chat.typeMessage')}
                      className="w-full px-4 py-3 pr-20 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 focus:ring-0 resize-none"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isLoading}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar - Members Panel */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-colors duration-300"
              >
                <div className="h-full flex flex-col">
                  <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('chat.members')}</h3>
                    <button
                      onClick={() => setShowMembers(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <MembersList
                      members={members}
                      onClose={() => setShowMembers(false)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <UserSearch
            board={board}
            onClose={() => setShowUserSearch(false)}
            onUserSelect={(_user) => {
              setShowUserSearch(false);
              loadMembers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
