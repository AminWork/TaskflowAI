import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Users, Search, X, MoreVertical, Trash2 } from 'lucide-react';
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
      initial={{ opacity: 0, x: isRTL ? -400 : 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? -400 : 400 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold">{board.title}</h3>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setShowUserSearch(true)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title={t('chat.searchUsers')}
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors relative"
            title={t('chat.showMembers')}
          >
            <Users size={18} />
            {members.some(m => m.isOnline) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title={t('common.close')}
          >
            <X size={18} />
          </button>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">{t('chat.noMessages')}</p>
            <p className="text-sm text-center mt-2">{t('chat.startConversation')}</p>
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
            className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 dark:text-gray-400"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">{t('chat.typing')}</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Paperclip size={16} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedFile.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-end space-x-2 rtl:space-x-reverse">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? t('chat.addCaption') : t('chat.typeMessage')}
              className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                title={t('chat.addEmoji')}
              >
                <Smile size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                title={t('chat.attachFile')}
              >
                <Paperclip size={16} />
              </button>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title={t('chat.sendMessage')}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 