import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Users, Search, X, MoreVertical, Trash2, MessageCircle } from 'lucide-react';
import { ChatMessage, ChatMember, KanbanBoard, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { MessageBubble } from './MessageBubble';
import { MembersList } from './MembersList';
import { UserSearch } from './UserSearch';
import { normalizeChatMessage, normalizeChatMember } from '../../utils/normalize';

interface ChatWindowProps {
  board: KanbanBoard;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ board, currentUser, isOpen, onClose }: ChatWindowProps) {
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages and members when component opens, and poll for member status
  useEffect(() => {
    if (isOpen && board) {
      loadMessages();
      loadMembers();

      const intervalId = setInterval(loadMembers, 5000); // Poll every 5 seconds

      return () => clearInterval(intervalId); // Cleanup on component unmount
    }
  }, [isOpen, board]);

  const loadMessages = async () => {
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/chat/boards/${board.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedMessages = (data.messages || []).map(normalizeChatMessage);
        setMessages(normalizedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/chat/boards/${board.id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedMembers = (data.members || []).map(normalizeChatMember);
        setMembers(normalizedMembers);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isLoading) return;

    setIsLoading(true);
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      
      let response;
      
      if (selectedFile) {
        // Send file with message
        const formData = new FormData();
        formData.append('content', newMessage.trim() || '');
        formData.append('sender', 'user');
        formData.append('file', selectedFile, selectedFile.name);
        formData.append('boardId', board.id);

        response = await fetch(`/api/chat/boards/${board.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type header, let the browser set it with the boundary
          },
          body: formData,
        });
      } else {
        // Send text message only
        response = await fetch(`/api/chat/boards/${board.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: newMessage.trim(),
            sender: 'user',
            boardId: board.id,
          }),
        });
      }

      if (response.ok) {
        const rawMessage = await response.json();
        const normalizedMessage = normalizeChatMessage(rawMessage);
        setMessages(prev => [...prev, normalizedMessage]);
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        inputRef.current?.focus();
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
        alert(t('chat.sendError'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(t('chat.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId: string) => {
    if (userId === currentUser.id) {
      return true; // Always show self as online
    }
    const member = members.find(m => m.userId === userId);
    return member ? member.isOnline : false;
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(t('chat.fileTooLarge'));
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -400 : 400, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isRTL ? -400 : 400, scale: 0.95 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderLeft: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '-10px 0 50px -10px rgba(0, 0, 0, 0.1), -2px 0 20px -5px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{board.title}</h3>
              <p className="text-white/70 text-sm">
                {members.filter(m => m.isOnline).length} online
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowUserSearch(true)}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            title={t('chat.searchUsers')}
          >
            <Search size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMembers(!showMembers)}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 relative"
            title={t('chat.showMembers')}
          >
            <Users size={18} />
            {members.some(m => m.isOnline) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            title={t('common.close')}
          >
            <X size={18} />
          </motion.button>
        </div>
      </div>

      {/* Members sidebar */}
      <AnimatePresence>
        {showMembers && (
          <MembersList
            members={members}
            onClose={() => setShowMembers(false)}
          />
        )}
      </AnimatePresence>

      {/* User search modal */}
      <AnimatePresence>
        {showUserSearch && (
          <UserSearch
            board={board}
            onClose={() => setShowUserSearch(false)}
            onUserSelect={() => setShowUserSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-3"
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-center text-lg font-medium text-gray-600">{t('chat.noMessages')}</p>
            <p className="text-sm text-center mt-2 text-gray-400">{t('chat.startConversation')}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={currentUser}
                onDelete={deleteMessage}
                isOnline={isUserOnline(message.userId)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            <span className="text-sm">{t('chat.typing')}</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div 
        className="p-6 border-t border-gray-100 bg-white"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* File preview */}
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Paperclip size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">{selectedFile.name}</p>
                <p className="text-xs text-blue-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={removeSelectedFile}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200"
            >
              <X size={16} />
            </motion.button>
          </motion.div>
        )}

        <div className="flex items-end space-x-3 rtl:space-x-reverse">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? t('chat.addCaption') : t('chat.typeMessage')}
              className="w-full px-6 py-4 pr-20 border-0 bg-gray-50 text-gray-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
              style={{
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
              }}
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title={t('chat.addEmoji')}
              >
                <Smile size={18} />
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title={t('chat.attachFile')}
              >
                <Paperclip size={18} />
              </motion.button>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isLoading}
            className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            style={{
              background: (!newMessage.trim() && !selectedFile) || isLoading 
                ? '#d1d5db' 
                : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
            }}
            title={t('chat.sendMessage')}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 