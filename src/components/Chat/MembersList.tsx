import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Shield, Eye, Users } from 'lucide-react';
import { ChatMember } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface MembersListProps {
  members: ChatMember[];
  onClose: () => void;
}

export function MembersList({ members, onClose }: MembersListProps) {
  const { t, isRTL } = useLanguage();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={14} className="text-blue-500" />;
      case 'viewer':
        return <Eye size={14} className="text-gray-500" />;
      default:
        return <Users size={14} className="text-green-500" />;
    }
  };

  const onlineMembers = members.filter(m => m.isOnline);
  const offlineMembers = members.filter(m => !m.isOnline);

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -300 : 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? -300 : 300 }}
      className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-800 z-10 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('chat.members')}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Online members */}
        {onlineMembers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('chat.online')} ({onlineMembers.length})
              </h4>
            </div>
            <div className="space-y-2">
              {onlineMembers.map((member) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={member.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                      alt={member.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-700 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getRoleIcon(member.role)}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.email}
                    </p>
                  </div>
                  
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                    {t(`board.${member.role}`)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Offline members */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('chat.offline')} ({offlineMembers.length})
              </h4>
            </div>
            <div className="space-y-2">
              {offlineMembers.map((member) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-75"
                >
                  <div className="relative">
                    <img
                      src={member.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                      alt={member.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm grayscale"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-700 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getRoleIcon(member.role)}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.email}
                    </p>
                  </div>
                  
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                    {t(`board.${member.role}`)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">{t('chat.noMembers')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
} 