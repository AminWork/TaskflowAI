import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Column, KanbanBoard, Permission } from './types';
import { KanbanColumn } from './components/KanbanColumn';
import { TaskForm } from './components/TaskForm';
import { AIAssistant } from './components/AIAssistant';
import { SearchAndFilter } from './components/SearchAndFilter';
import { AuthForm } from './components/AuthForm';
import { Navigation } from './components/Navigation';
import { Analytics } from './components/Analytics';
import { MemberManagement } from './components/MemberManagement';
import { BoardForm } from './components/BoardForm';
import { BoardDashboard } from './components/BoardDashboard';
import { QuickInviteModal } from './components/QuickInviteModal';
import { InviteNotifications } from './components/InviteNotifications';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { useBoards } from './hooks/useBoards';
import { useTasks } from './hooks/useTasks';
import { Plus, Sparkles } from 'lucide-react';

const columns: Column[] = [
  { id: '1', title: 'To Do', status: 'todo', color: 'bg-blue-500' },
  { id: '2', title: 'In Progress', status: 'inprogress', color: 'bg-yellow-500' },
  { id: '3', title: 'Done', status: 'done', color: 'bg-green-500' },
];

function App() {
  const { user, token, isLoading, login, register, logout, isAuthenticated } = useAuth();
  const {
    boards,
    currentBoard,
    invitations,
    setCurrentBoard,
    createBoard,
    inviteUser,
    acceptInvitation,
    declineInvitation,
    removeMember,
    updateMemberRole,
    hasPermission,
    deleteBoard,
  } = useBoards(user, token);

  const {
    tasks,
    isLoading: isTasksLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useTasks(currentBoard?.id || null, token);
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'analytics' | 'members'>('dashboard');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | undefined>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<Task['status']>('todo');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Analytics
  const analytics = useAnalytics(tasks);

  // Auto-select first board if none selected
  useEffect(() => {
    if (!currentBoard && boards.length > 0) {
      setCurrentBoard(boards[0]);
    }
  }, [boards, currentBoard, setCurrentBoard]);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean)));

  // Filter tasks based on search and filter criteria
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const handleAddTask = (status: Task['status']) => {
    if (!currentBoard || !hasPermission(currentBoard.id, 'create_task')) {
      alert('You do not have permission to create tasks');
      return;
    }
    setDefaultStatus(status);
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    if (!currentBoard || !hasPermission(currentBoard.id, 'edit_task')) {
      alert('You do not have permission to edit tasks');
      return;
    }
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      // Update existing task
      await updateTask(editingTask.id, taskData);
    } else {
      // Create new task
      await createTask(taskData);
    }
    setIsTaskFormOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (!currentBoard || !hasPermission(currentBoard.id, 'delete_task')) {
      alert('You do not have permission to delete tasks');
      return;
    }
    await deleteTask(id);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (!currentBoard || !hasPermission(currentBoard.id, 'move_task')) {
      alert('You do not have permission to move tasks');
      return;
    }
    if (draggedTask && draggedTask.status !== status) {
      await moveTask(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  const handleTaskCreatedByAI = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    handleSaveTask(taskData);
  };

  const handleCreateBoard = async (title: string, description?: string) => {
    const newBoard = await createBoard(title, description);
    if (newBoard) {
      setIsBoardFormOpen(false);
      setEditingBoard(undefined);
      setCurrentView('kanban');
    }
  };

  const handleEditBoard = (board: KanbanBoard) => {
    setEditingBoard(board);
    setIsBoardFormOpen(true);
  };

  const handleSelectBoard = (board: KanbanBoard) => {
    setCurrentBoard(board);
    setCurrentView('kanban');
  };

  const handleViewChange = (view: 'dashboard' | 'kanban' | 'analytics' | 'members') => {
    if (!currentBoard && view !== 'dashboard' && view !== 'kanban') {
      alert('Please select or create a board first');
      return;
    }
    setCurrentView(view);
  };

  const handleInviteUsers = async (boardId: string, email: string, role: 'admin' | 'member' | 'viewer') => {
    try {
      await inviteUser(boardId, email, role);
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  };

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onLogin={login} onRegister={register} isLoading={isLoading} />;
  }

  // Show dashboard if no board is selected or on dashboard view
  if (currentView === 'dashboard' || (!currentBoard && boards.length > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Navigation */}
        <Navigation
          user={user!}
          currentView={currentView}
          onViewChange={handleViewChange}
          onLogout={logout}
          boards={boards}
          currentBoard={currentBoard}
          onBoardSelect={setCurrentBoard}
          onCreateBoard={() => setIsBoardFormOpen(true)}
          onInviteUsers={() => setIsInviteModalOpen(true)}
          invitationCount={invitations.filter(inv => inv.status === 'pending').length}
        />

        {/* Invite Notifications */}
        <div className="container mx-auto px-4 pt-8">
          <InviteNotifications
            invitations={invitations}
            onAcceptInvitation={acceptInvitation}
            onDeclineInvitation={declineInvitation}
          />
        </div>

        <BoardDashboard
          boards={boards}
          currentUser={user!}
          onBoardSelect={handleSelectBoard}
          onCreateBoard={() => setIsBoardFormOpen(true)}
          onEditBoard={handleEditBoard}
          onDeleteBoard={deleteBoard}
          onInviteUsers={() => setIsInviteModalOpen(true)}
          hasPermission={hasPermission}
        />
        
        {/* Quick Invite Modal */}
        <QuickInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          boards={boards}
          onInviteUser={handleInviteUsers}
        />
        
        <BoardForm
          board={editingBoard}
          isOpen={isBoardFormOpen}
          onClose={() => {
            setIsBoardFormOpen(false);
            setEditingBoard(undefined);
          }}
          onSave={handleCreateBoard}
        />
      </div>
    );
  }

  // Show board creation if no boards exist
  if (boards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl mb-6 inline-block">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to TaskFlow AI</h1>
          <p className="text-gray-600 mb-8">Create your first board to start managing tasks with your team.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsBoardFormOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 text-lg font-semibold mx-auto"
          >
            <Plus size={24} />
            <span>Create Your First Board</span>
          </motion.button>
        </motion.div>
        
        <BoardForm
          isOpen={isBoardFormOpen}
          onClose={() => setIsBoardFormOpen(false)}
          onSave={handleCreateBoard}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <Navigation
        user={user!}
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={logout}
        boards={boards}
        currentBoard={currentBoard}
        onBoardSelect={setCurrentBoard}
        onCreateBoard={() => setIsBoardFormOpen(true)}
        onInviteUsers={() => setIsInviteModalOpen(true)}
        invitationCount={invitations.filter(inv => inv.status === 'pending').length}
      />

      {/* Quick Invite Modal */}
      <QuickInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        boards={boards}
        onInviteUser={handleInviteUsers}
        currentBoardId={currentBoard?.id}
      />

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              {currentBoard && (
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center space-x-3 mb-4"
                  >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {currentBoard.title}
                    </h1>
                    <Sparkles size={32} className="text-purple-500" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 text-lg"
                  >
                    {currentBoard.description || 'Manage your tasks with AI assistance and voice commands'}
                  </motion.p>
                </div>
              )}

              {currentBoard && (
                <>
                  {/* Search and Filter */}
                  <SearchAndFilter
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    priorityFilter={priorityFilter}
                    onPriorityFilterChange={setPriorityFilter}
                    categoryFilter={categoryFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    categories={categories}
                  />

                  {/* Quick Add Button */}
                  {hasPermission(currentBoard.id, 'create_task') && (
                    <div className="flex justify-center mb-8">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddTask('todo')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 text-lg font-semibold"
                      >
                        <Plus size={24} />
                        <span>Create New Task</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Kanban Board */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {columns.map((column, index) => (
                      <motion.div
                        key={column.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <KanbanColumn
                          column={column}
                          tasks={filteredTasks.filter(task => task.status === column.status)}
                          onAddTask={handleAddTask}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={handleEditTask}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragStart={handleDragStart}
                        />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === 'analytics' ? (
                <Analytics analytics={analytics} />
              ) : (
                currentBoard && (
                  <MemberManagement
                    board={currentBoard}
                    invitations={invitations}
                    currentUser={user!}
                    onInviteUser={(email, role) => inviteUser(currentBoard.id, email, role)}
                    onRemoveMember={(userId) => removeMember(currentBoard.id, userId)}
                    onUpdateRole={(userId, role) => updateMemberRole(currentBoard.id, userId, role)}
                    onAcceptInvitation={acceptInvitation}
                    onDeclineInvitation={declineInvitation}
                    hasPermission={(action) => hasPermission(currentBoard.id, action as Permission['action'])}
                  />
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Form Modal */}
        <TaskForm
          task={editingTask}
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSave={handleSaveTask}
          defaultStatus={defaultStatus}
        />
        
        {/* Board Form Modal */}
        <BoardForm
          board={editingBoard}
          isOpen={isBoardFormOpen}
          onClose={() => {
            setIsBoardFormOpen(false);
            setEditingBoard(undefined);
          }}
          onSave={handleCreateBoard}
        />

        {/* AI Assistant */}
        {currentView === 'kanban' && (
          <AIAssistant
            tasks={tasks}
            onTaskCreated={handleTaskCreatedByAI}
          />
        )}
      </div>
    </div>
  );
}

export default App;