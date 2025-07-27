import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KanbanBoard, Task, User } from '../types';
import { BoardDashboard } from './BoardDashboard';
import { KanbanColumn } from './KanbanColumn';
import { Analytics } from './Analytics';
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
  handleAddTask: (status: Task['status']) => void;
  handleDeleteTask: (id: string) => void;
  handleEditTask: (task: Task) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, status: Task['status']) => void;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  analytics: any;
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
  handleAddTask,
  handleDeleteTask,
  handleEditTask,
  handleDragOver,
  handleDrop,
  handleDragStart,
  analytics,
  user,
  invitations,
  inviteUser,
  removeMember,
  updateMemberRole,
  acceptInvitation,
  declineInvitation,
}) => {
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
            currentBoard={currentBoard}
            onSelectBoard={onSelectBoard}
            onDeleteBoard={onDeleteBoard}
            hasPermission={hasPermission}
            tasks={filteredTasks}
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
                  boardMembers={currentBoard?.members}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {currentView === 'analytics' && currentBoard && (
        <motion.div
          key="analytics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Analytics analytics={analytics} />
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
