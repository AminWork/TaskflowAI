import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, Loader } from 'lucide-react';
import { SearchUser, KanbanBoard, BoardMember } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserSearchProps {
  board: KanbanBoard;
  onClose: () => void;
  onUserSelect: (user: SearchUser) => void;
}

export function UserSearch({ board, onClose, onUserSelect }: UserSearchProps) {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const inviteUser = async (user: SearchUser) => {
    setIsInviting(true);
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/boards/${board.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          role: 'member',
        }),
      });

      if (response.ok) {
        alert(t('invite.sent'));
        onUserSelect(user);
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('invite.failed'));
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert(t('invite.failed'));
    } finally {
      setIsInviting(false);
    }
  };

  // Check if user is already a member
  const isUserMember = (user: SearchUser) => {
    return board.members.some((member: BoardMember) => member.email === user.email);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('chat.searchUsers')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={20} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chat.searchPlaceholder')}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
            {isSearching && (
              <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
                <Loader size={16} className="animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* Search results */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim().length < 2 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('chat.searchHint')}</p>
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('chat.noResults')}</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {searchResults.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img
                      src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {isUserMember(user) ? (
                    <span className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      {t('invite.alreadyMember')}
                    </span>
                  ) : (
                    <button
                      onClick={() => inviteUser(user)}
                      disabled={isInviting}
                      className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isInviting ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      <span>{t('invite.invite')}</span>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 