import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard, User, Permission } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Users, 
  Calendar,
  Star,
  Archive,
  MoreVertical,
  Edit2,
  Trash2,
  Settings,
  Clock
} from 'lucide-react';

interface BoardDashboardProps {
  boards: KanbanBoard[];
  currentUser: User;
  onBoardSelect: (board: KanbanBoard) => void;
  onCreateBoard: () => void;
  onEditBoard: (board: KanbanBoard) => void;
  onDeleteBoard: (boardId: string) => void;
  hasPermission: (boardId: string, action: Permission['action']) => boolean;
}

export function BoardDashboard({ 
  boards, 
  currentUser, 
  onBoardSelect, 
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
  hasPermission
}: BoardDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'owned' | 'member'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter boards based on search and filter criteria
  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'owned' && board.createdBy === currentUser.id) ||
                         (filter === 'member' && board.createdBy !== currentUser.id);
    
    return matchesSearch && matchesFilter;
  });

  const getUserRole = (board: KanbanBoard) => {
    return board.members.find(m => m.userId === currentUser.id)?.role || 'viewer';
  };

  const handleBoardAction = (action: string, board: KanbanBoard) => {
    setActiveDropdown(null);
    switch (action) {
      case 'edit':
        onEditBoard(board);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${board.title}"? This action cannot be undone.`)) {
          onDeleteBoard(board.id);
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Boards
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and organize your kanban boards
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateBoard}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Board</span>
          </motion.button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'owned' | 'member')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Boards</option>
              <option value="owned">Owned by Me</option>
              <option value="member">Member Of</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Boards Grid/List */}
      {filteredBoards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="bg-gray-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Archive size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No boards found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first board to get started'
            }
          </p>
          {!searchQuery && filter === 'all' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateBoard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <Plus size={20} />
              <span>Create First Board</span>
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          <AnimatePresence>
            {filteredBoards.map((board, index) => (
              <motion.div
                key={board.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
                onClick={() => onBoardSelect(board)}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                          {board.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {board.description || 'No description'}
                        </p>
                      </div>
                      
                      {hasPermission(board.id, 'manage_board') && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === board.id ? null : board.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeDropdown === board.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBoardAction('edit', board);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Edit2 size={14} />
                                <span>Edit</span>
                              </button>
                              {board.createdBy === currentUser.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBoardAction('delete', board);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Users size={14} />
                          <span>{board.members.length} members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            getUserRole(board) === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                            getUserRole(board) === 'admin' ? 'bg-blue-100 text-blue-800' :
                            getUserRole(board) === 'member' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getUserRole(board)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Updated {new Date(board.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {board.title}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {board.description || 'No description'}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users size={14} />
                            <span>{board.members.length}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            getUserRole(board) === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                            getUserRole(board) === 'admin' ? 'bg-blue-100 text-blue-800' :
                            getUserRole(board) === 'member' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getUserRole(board)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {hasPermission(board.id, 'manage_board') && (
                        <div className="relative ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === board.id ? null : board.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeDropdown === board.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBoardAction('edit', board);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Edit2 size={14} />
                                <span>Edit</span>
                              </button>
                              {board.createdBy === currentUser.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBoardAction('delete', board);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
} 