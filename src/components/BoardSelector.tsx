import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard, User } from '../types';
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
        className="flex items-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 text-white hover:bg-white/20 transition-all duration-300 min-w-[200px]"
      >
        <div className="flex-1 text-left">
          <p className="font-medium truncate">
            {currentBoard ? currentBoard.title : 'Select Board'}
          </p>
          {currentBoard && (
            <div className="flex items-center space-x-1 text-xs text-white/70">
              {getRoleIcon(getUserRole(currentBoard))}
              <span className="capitalize">{getUserRole(currentBoard)}</span>
              <span>•</span>
              <span>{currentBoard.members.length} members</span>
            </div>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {boards.map((board) => (
                <motion.button
                  key={board.id}
                  whileHover={{ backgroundColor: '#f8fafc' }}
                  onClick={() => {
                    onBoardSelect(board);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{board.title}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        {getRoleIcon(getUserRole(board))}
                        <span className="capitalize">{getUserRole(board)}</span>
                        <span>•</span>
                        <span>{board.members.length} members</span>
                      </div>
                    </div>
                    {currentBoard?.id === board.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 p-2">
              <motion.button
                whileHover={{ backgroundColor: '#f8fafc' }}
                onClick={() => {
                  onCreateBoard();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span className="font-medium">Create New Board</span>
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