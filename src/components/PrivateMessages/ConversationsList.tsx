import React, { useState, useEffect } from 'react';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Private Messages</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={requestNotificationPermission}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Enable notifications"
              >
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center">No conversations yet</p>
                <p className="text-sm text-center mt-1">Start a new conversation to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.userId}
                    onClick={() => handleConversationClick(conversation)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                          alt={conversation.userName}
                          className="w-10 h-10 rounded-full"
                        />
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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