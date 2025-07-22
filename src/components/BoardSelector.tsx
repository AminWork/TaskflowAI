import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Users, Settings, ChevronDown, Crown, Shield, Eye } from 'lucide-react';

interface BoardSelectorProps {
  boards: KanbanBoard[];
  currentBoard: KanbanBoard | null;
  onBoardSelect: (board: KanbanBoard) => void;
  onCreateBoard: () => void;
  currentUser: User;
}

export function BoardSelector({ 
  boards, 
  currentBoard, 
  onBoardSelect, 
  onCreateBoard,
  currentUser 
}: BoardSelectorProps) {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={14} className="text-yellow-500" />;
      case 'admin': return <Shield size={14} className="text-blue-500" />;
      case 'member': return <Users size={14} className="text-green-500" />;
      case 'viewer': return <Eye size={14} className="text-gray-500" />;
      default: return null;
    }
  };

  const getUserRole = (board: KanbanBoard) => {
    return board.members.find(m => m.userId === currentUser.id)?.role || 'viewer';
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 rtl:space-x-reverse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 min-w-[200px] shadow-sm"
      >
        <div className="flex-1 text-left">
          <p className="font-medium truncate">
            {currentBoard ? currentBoard.title : t('board.selectBoard')}
          </p>
          {currentBoard && (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1 text-xs text-gray-600 dark:text-gray-400`}>
              {getRoleIcon(getUserRole(currentBoard))}
              <span className="capitalize">{t(`board.${getUserRole(currentBoard)}`)}</span>
              <span>•</span>
              <span>{currentBoard.members.length} {t('dashboard.members')}</span>
            </div>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {boards.map((board) => (
                <motion.button
                  key={board.id}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  onClick={() => {
                    onBoardSelect(board);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{board.title}</p>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1`}>
                        {getRoleIcon(getUserRole(board))}
                        <span className="capitalize">{t(`board.${getUserRole(board)}`)}</span>
                        <span>•</span>
                        <span>{board.members.length} {t('dashboard.members')}</span>
                      </div>
                    </div>
                    {currentBoard?.id === board.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                onClick={() => {
                  onCreateBoard();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors`}
              >
                <Plus size={16} />
                <span className="font-medium">{t('dashboard.newBoard')}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}