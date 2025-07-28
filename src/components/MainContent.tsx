import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KanbanBoard, Task, User, Column } from '../types';
import { BoardDashboard } from './BoardDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { KanbanColumn } from './KanbanColumn';
import { AddColumnCard } from './AddColumnCard';
import { AnalyticsPage } from './AnalyticsPage';
import { MemberManagement } from './MemberManagement';
import CalendarPage from './CalendarPage';

interface MainContentProps {
  currentView: 'dashboard' | 'kanban' | 'analytics' | 'members' | 'calendar';
  currentBoard: KanbanBoard | null;
  boards: KanbanBoard[];
  onSelectBoard: (board: KanbanBoard) => void;
  onDeleteBoard: (boardId: string) => void;
  hasPermission: (boardId: string, action: 'create_task' | 'edit_task' | 'delete_task' | 'move_task' | 'invite_users' | 'manage_board' | 'delete_board' | 'add_member' | 'remove_member' | 'edit_board') => boolean;
  columns: any[];
  filteredTasks: Task[];
  onAddColumn: (title: string) => void;
  handleAddTask: (status: Task['status']) => void;
  handleDeleteTask: (id: string) => void;
  handleEditTask: (task: Task) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, status: Task['status']) => void;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  allTasks: any[];
  user: User;
  invitations: any[];
  inviteUser: (boardId: string, email: string, role: 'admin' | 'member' | 'viewer') => void;
  removeMember: (boardId: string, userId: string) => void;
  updateMemberRole: (boardId: string, userId: string, role: 'admin' | 'member' | 'viewer') => void;
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  currentView,
  currentBoard,
  boards,
  onSelectBoard,
  onDeleteBoard,
  hasPermission,
  columns,
  filteredTasks,
  onAddColumn,
  handleAddTask,
  handleDeleteTask,
  handleEditTask,
  handleDragOver,
  handleDrop,
  handleDragStart,
  allTasks,
  user,
  invitations,
  inviteUser,
  removeMember,
  updateMemberRole,
  acceptInvitation,
  declineInvitation,
}) => {
  const { isRTL } = useLanguage();
  return (
    <AnimatePresence mode="wait">
      {currentView === 'dashboard' && currentBoard && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <BoardDashboard
            boards={boards}
            currentUser={user}
            onBoardSelect={onSelectBoard}
            onCreateBoard={() => {}}
            onEditBoard={() => {}}
            onDeleteBoard={onDeleteBoard}
            onInviteUsers={() => {}}
            hasPermission={hasPermission}
          />
        </motion.div>
      )}

      {currentView === 'kanban' && currentBoard && (
        <motion.div
          key="kanban"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} space-x-8 overflow-x-auto pb-4`}>
            {/* Existing columns */}
            {columns.map((column: Column, index: number) => (
              <motion.div
                key={column.id}
                className="flex-none w-80"
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
                  boardMembers={currentBoard?.members}
                />
              </motion.div>
            ))}
            {/* Add Column Card */}
            <motion.div
              key="add-column"
              className="flex-none w-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AddColumnCard onAddColumn={onAddColumn} />
            </motion.div>
          </div>
        </motion.div>
      )}

      {currentView === 'analytics' && (
        <motion.div
          key="analytics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <AnalyticsPage boards={boards} tasks={allTasks} />
        </motion.div>
      )}

      {currentView === 'members' && currentBoard && (
        <motion.div
          key="members"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MemberManagement
            board={currentBoard}
            invitations={invitations}
            currentUser={user!}
            onInviteUser={(email, role) => inviteUser(currentBoard.id, email, role)}
            onRemoveMember={(userId) => removeMember(currentBoard.id, userId)}
            onUpdateRole={(userId, role) => updateMemberRole(currentBoard.id, userId, role)}
            onAcceptInvitation={acceptInvitation}
            onDeclineInvitation={declineInvitation}
            hasPermission={(action) => hasPermission(currentBoard.id, action as any)}
          />
        </motion.div>
      )}

      {currentView === 'calendar' && (
        <motion.div
          key="calendar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CalendarPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
