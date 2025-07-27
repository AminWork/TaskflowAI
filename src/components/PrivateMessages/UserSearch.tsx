import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SearchUser } from '../../types';

interface UserSearchProps {
  onSelectUser: (user: any) => void;
  onClose: () => void;
}

export function UserSearch({ onSelectUser, onClose }: UserSearchProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    const selectedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: new Date(user.createdAt),
    };
    onSelectUser(selectedUser);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[600px] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-100"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Search size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Find Users</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-12 pr-4 py-4 border-0 bg-gray-50 text-gray-900 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200 shadow-sm"
              style={{
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-500 border-t-transparent"></div>
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-center text-lg font-medium text-gray-600">Start searching</p>
              <p className="text-sm text-center mt-2 text-gray-400">Type at least 2 characters to search</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full flex items-center justify-center mb-6">
                <UserIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-center text-lg font-medium text-gray-600">No users found</p>
              <p className="text-sm text-center mt-2 text-gray-400">Try a different search term</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleUserSelect(user)}
                  className="bg-white rounded-2xl p-4 hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-100 hover:border-purple-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
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
  );
} 