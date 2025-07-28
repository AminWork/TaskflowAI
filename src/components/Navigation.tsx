import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kanban, BarChart3, LogOut, Users, Sparkles, Grid3X3, UserPlus, Bell, Calendar, ChevronDown } from 'lucide-react';
import { User as UserType, KanbanBoard } from '../types';
import { BoardSelector } from './BoardSelector';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  user: UserType;
  currentView: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar';
  onViewChange: (view: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar') => void;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close dropdown when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  
  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Grid3X3 },
    { id: 'kanban', label: t('nav.kanban'), icon: Kanban },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'members', label: t('nav.members'), icon: Users },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
  ] as const;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300"
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-8`}>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}
            >
              <div className="bg-teal-500 p-2 rounded-xl shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
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
          </div>

          {/* Navigation Items */}
          <div className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-full`}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange(item.id as 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar')}
                disabled={!currentBoard && item.id !== 'dashboard'}
                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                  currentView === item.id
                    ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-sm'
                    : !currentBoard && item.id !== 'dashboard'
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Right side actions */}
          <div className={`relative flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`} ref={menuRef}>
            {/* User Menu trigger */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 focus:outline-none`}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full border-2 border-slate-300 dark:border-slate-600"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-14 w-56 bg-white dark:bg-slate-800 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 z-50`}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {t('nav.preferences')}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer">
                    <span className="text-sm text-slate-700 dark:text-slate-200">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer">
                    <span className="text-sm text-slate-700 dark:text-slate-200">Language</span>
                    <LanguageToggle />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={onInviteUsers}>
                    <span className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200">
                      <UserPlus className="w-4 h-4" />
                      <span>{t('nav.inviteUsers')}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={() => { onViewChange('dashboard'); setIsMenuOpen(false); }}>
                    <span className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200">
                      <Bell className="w-4 h-4" />
                      <span>{t('nav.viewInvitations')}</span>
                    </span>
                    {invitationCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-4 px-1 flex items-center justify-center">
                        {invitationCount > 9 ? '9+' : invitationCount}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                  <div className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{t('auth.logout')}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>
      </div>
    </motion.nav>
  );
}