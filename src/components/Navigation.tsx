import React from 'react';
import { motion } from 'framer-motion';
import { Kanban, BarChart3, LogOut, Users, Sparkles, Grid3X3, UserPlus, Bell } from 'lucide-react';
import { User as UserType, KanbanBoard } from '../types';
import { BoardSelector } from './BoardSelector';

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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid3X3 },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'members', label: 'Team Members', icon: Users },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
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
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange(item.id as 'dashboard' | 'kanban' | 'analytics' | 'members')}
                disabled={!currentBoard && item.id !== 'dashboard' && item.id !== 'kanban'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : !currentBoard && item.id !== 'dashboard' && item.id !== 'kanban'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            {/* Invite Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInviteUsers}
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              title="Invite Users"
            >
              <UserPlus className="w-5 h-5" />
            </motion.button>

            {/* Invitations Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange('dashboard')}
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              title="View Invitations"
            >
              <Bell className="w-5 h-5" />
              {invitationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {invitationCount > 9 ? '9+' : invitationCount}
                </span>
              )}
            </motion.button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-gray-200"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}