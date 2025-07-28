import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Column, KanbanBoard, Permission } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { useNotifications } from './contexts/NotificationContext';
import { TaskForm } from './components/TaskForm';
import { AIAssistant } from './components/AIAssistant';
import { AuthForm } from './components/AuthForm';
import { Navigation } from './components/Navigation';
import { BoardForm } from './components/BoardForm';
import { BoardDashboard } from './components/BoardDashboard';
import { QuickInviteModal } from './components/QuickInviteModal';
import { InviteNotifications } from './components/InviteNotifications';
import { useAuth } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { useBoards } from './hooks/useBoards';
import { useTasks } from './hooks/useTasks';
import { ChatWindow } from './components/Chat/ChatWindow';
import { ConversationsList } from './components/PrivateMessages/ConversationsList';
import { MainContent } from './components/MainContent';
import { migrateLocalStorageKeys } from './utils/migrateLocalStorage';
import { useWebSocket } from './hooks/useWebSocket';
import { MessageCircle, Mail } from 'lucide-react';

function App() {
  // Run localStorage migration on app start
  useEffect(() => {
    migrateLocalStorageKeys();
  }, []);

  const { t, isRTL, language } = useLanguage();
  const { unreadMessages, requestNotificationPermission } = useNotifications();

const columns: Column[] = [
    { id: '1', title: t('task.todo'), status: 'todo', color: 'bg-slate-100 dark:bg-slate-700' },
    { id: '2', title: t('task.inprogress'), status: 'inprogress', color: 'bg-slate-200 dark:bg-slate-600' },
    { id: '3', title: t('task.done'), status: 'done', color: 'bg-slate-300 dark:bg-slate-500' },
];

  const { user, token, isLoading, login, register, logout, isAuthenticated } = useAuth();
  
  // Request notification permission when app loads
  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated, requestNotificationPermission]);
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar'>('dashboard');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | undefined>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<Task['status']>('todo');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrivateMessagesOpen, setIsPrivateMessagesOpen] = useState(false);

  // Analytics
  const analytics = useAnalytics(tasks);

  // Auto-select first board if none selected
  useEffect(() => {
    if (!currentBoard && boards.length > 0) {
      setCurrentBoard(boards[0]);
    }
  }, [boards, currentBoard, setCurrentBoard]);
  // Connect to WebSocket for private messages
  useWebSocket({
    messageTypes: ['private_message'],
  });

  // TODO: Re-implement filtering logic if needed
  const filteredTasks = tasks;

  const handleAddTask = (status: Task['status']) => {
    if (!currentBoard || !hasPermission(currentBoard.id, 'create_task')) {
      alert(t('auth.noPermission'));
      return;
    }
    setDefaultStatus(status);
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    if (!currentBoard || !hasPermission(currentBoard.id, 'edit_task')) {
      alert(t('auth.noPermission'));
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
      alert(t('auth.noPermission'));
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
      alert(t('auth.noPermission'));
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

  const handleViewChange = (view: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar') => {
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={language}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {(() => {
  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onLogin={login} onRegister={register} isLoading={isLoading} />;
  }

          // Show dashboard if no board is selected or on dashboard view
          if (currentView === 'dashboard' || (!currentBoard && boards.length > 0)) {
    return (
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
                {/* Navigation */}
                <Navigation
                  key={language} // Add key to force re-render on language change
                  user={user!}
                  currentView={currentView}
                  onViewChange={(view: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar') => handleViewChange(view)}
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
          onInviteUser={handleInviteUsers}
          boards={boards}
          currentBoardId={currentBoard?.id}
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

          // Main Kanban View
  return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 pb-6 transition-colors duration-300">
      {/* Navigation */}
      <Navigation
                key={language} // Add key to force re-render on language change
        user={user!}
        currentView={currentView}
        onViewChange={(view: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar') => handleViewChange(view)}
        onLogout={logout}
        boards={boards}
        currentBoard={currentBoard}
        onBoardSelect={handleSelectBoard}
        onCreateBoard={() => {
            setEditingBoard(undefined);
            setIsBoardFormOpen(true);
          }}
                onInviteUsers={() => setIsInviteModalOpen(true)}
                invitationCount={invitations.length}
              />

              {/* Private Messages Toggle Button */}
              <motion.button
                key={`private-messages-button-${language}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPrivateMessagesOpen(!isPrivateMessagesOpen)}
                className={`fixed ${isRTL ? 'right-6' : 'left-6'} bottom-8 p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40`}
                title="Private Messages"
              >
                <Mail size={24} />
                {unreadMessages > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </div>
                )}
              </motion.button>

              {/* Chat Toggle Button */}
              <motion.button
                key={`chat-button-${language}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 ${!currentBoard ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={t('chat.title')}
                disabled={!currentBoard}
              >
                <MessageCircle size={24} />
              </motion.button>

              {/* Private Messages */}
              <AnimatePresence>
                {isPrivateMessagesOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className={`fixed bottom-24 ${isRTL ? 'right-8' : 'left-8'} z-50`}
                  >
                    <ConversationsList
                      currentUser={user}
                      isOpen={isPrivateMessagesOpen}
                      onClose={() => setIsPrivateMessagesOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Window */}
              <AnimatePresence>
                {isChatOpen && currentBoard && user && (
                  <ChatWindow
                    board={currentBoard}
                    currentUser={user}
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                  />
                )}
              </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {currentBoard ? (
            <MainContent
                currentView={currentView}
                currentBoard={currentBoard}
                boards={boards}
                onSelectBoard={handleSelectBoard}
                onDeleteBoard={deleteBoard}
                hasPermission={(action) => hasPermission(currentBoard!.id, action as Permission['action'])}
                columns={columns}
                filteredTasks={filteredTasks}
                handleAddTask={handleAddTask}
                handleDeleteTask={handleDeleteTask}
                handleEditTask={handleEditTask}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragStart={handleDragStart}
                analytics={analytics}
                user={user!}
                invitations={invitations}
                inviteUser={inviteUser}
                removeMember={removeMember}
                updateMemberRole={updateMemberRole}
                acceptInvitation={acceptInvitation}
                declineInvitation={declineInvitation}
            />
        ) : (
            <BoardDashboard
                boards={boards}
                currentUser={user!}
                onBoardSelect={handleSelectBoard}
                onCreateBoard={() => setIsBoardFormOpen(true)}
                onDeleteBoard={deleteBoard}
                onEditBoard={handleEditBoard}
                onInviteUsers={() => setIsInviteModalOpen(true)}
            />
        )}

        {/* Task Form Modal */}
        <TaskForm
          task={editingTask}
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSave={handleSaveTask}
          defaultStatus={defaultStatus}
          boardMembers={currentBoard?.members}
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
        })()}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;