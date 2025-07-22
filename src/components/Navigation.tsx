import React from 'react';
import { motion } from 'framer-motion';
import { Kanban, BarChart3, LogOut, Users, Sparkles, Grid3X3, UserPlus, Bell } from 'lucide-react';
import { User as UserType, KanbanBoard } from '../types';
import { BoardSelector } from './BoardSelector';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  user: UserType;
  currentView: 'dashboard' | 'kanban' | 'analytics' | 'members';
  onViewChange: (view: 'dashboard' | 'kanban' | 'analytics' | 'members') => void;
  onLogout: () => void;
  boards: KanbanBoard[];
  currentBoard: KanbanBoard | null;
  onBoardSelect: (board: KanbanBoard) => void;
  onCreateBoard: () => void;
  onInviteUsers: () => void;
  invitationCount?: number;
}

export function Navigation({ 
  user, 
  currentView, 
  onViewChange, 
  onLogout,
  boards,
  currentBoard,
  onBoardSelect,
  onCreateBoard,
  onInviteUsers,
  invitationCount = 0
}: NavigationProps) {
  const { t, isRTL } = useLanguage();
  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Grid3X3 },
    { id: 'kanban', label: t('nav.kanban'), icon: Kanban },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'members', label: t('nav.members'), icon: Users },
  ] as const;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300"
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TaskFlow AI
            </span>
          </motion.div>

          {/* Board Selector */}
          <BoardSelector
            boards={boards}
            currentBoard={currentBoard}
            onBoardSelect={onBoardSelect}
            onCreateBoard={onCreateBoard}
            currentUser={user}
          />

          {/* Navigation Items */}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange(item.id as 'dashboard' | 'kanban' | 'analytics' | 'members')}
                disabled={!currentBoard && item.id !== 'dashboard' && item.id !== 'kanban'}
                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : !currentBoard && item.id !== 'dashboard' && item.id !== 'kanban'
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Invite Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInviteUsers}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300"
              title={t('nav.inviteUsers')}
            >
              <UserPlus className="w-5 h-5" />
            </motion.button>

            {/* Invitations Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange('dashboard')}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300"
              title={t('nav.viewInvitations')}
            >
              <Bell className="w-5 h-5" />
              {invitationCount > 0 && (
                <span className={`absolute ${isRTL ? '-left-1' : '-right-1'} -top-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                  {invitationCount > 9 ? '9+' : invitationCount}
                </span>
              )}
            </motion.button>
          </div>

          {/* User Menu */}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300"
              title={t('auth.logout')}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}