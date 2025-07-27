import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X, Plus, Bell } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { PrivateConversation, User } from '../../types';
import { PrivateMessageWindow } from './PrivateMessageWindow';
import { UserSearch } from './UserSearch';

interface ConversationsListProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationsList({ currentUser, isOpen, onClose }: ConversationsListProps) {
  const { t } = useLanguage();
  const { resetUnreadCount, requestNotificationPermission } = useNotifications();
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations when component opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      requestNotificationPermission(); // Request notification permission when opening conversations
    }
  }, [isOpen, requestNotificationPermission]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch('/api/private-messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: PrivateConversation) => {
    const user: User = {
      id: conversation.userId,
      name: conversation.userName,
      email: conversation.userEmail,
      avatar: conversation.avatar,
      createdAt: new Date(),
    };
    setSelectedUser(user);
  };

  const handleNewConversation = (user: User) => {
    setSelectedUser(user);
    setShowUserSearch(false);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const handlePrivateMessageClose = () => {
    setSelectedUser(null);
    loadConversations(); // Refresh conversations to update unread counts
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[700px] flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b border-gray-100"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Messages</h3>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={requestNotificationPermission}
                className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                title="Enable notifications"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowUserSearch(true)}
                className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Conversations List */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-500 border-t-transparent"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-center text-lg font-medium text-gray-600">No conversations yet</p>
                <p className="text-sm text-center mt-2 text-gray-400">Start a new conversation to get started</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleConversationClick(conversation)}
                    className="bg-white rounded-2xl p-4 hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-100 hover:border-green-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={conversation.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face`}
                          alt={conversation.userName}
                          className="w-12 h-12 rounded-full shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {conversation.userName}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate leading-relaxed">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Private Message Window */}
      {selectedUser && (
        <PrivateMessageWindow
          recipient={selectedUser}
          currentUser={currentUser}
          isOpen={!!selectedUser}
          onClose={handlePrivateMessageClose}
        />
      )}

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onSelectUser={handleNewConversation}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </>
  );
} 