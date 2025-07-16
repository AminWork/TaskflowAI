export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface Column {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  color: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  members: BoardMember[];
  settings: BoardSettings;
}

export interface BoardMember {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  permissions: Permission[];
}

export interface Permission {
  action: 'create_task' | 'edit_task' | 'delete_task' | 'move_task' | 'invite_users' | 'manage_board';
  granted: boolean;
}

export interface BoardSettings {
  allowGuestAccess: boolean;
  requireApprovalForNewMembers: boolean;
  defaultMemberRole: 'member' | 'viewer';
}

export interface BoardInvitation {
  id: string;
  boardId: string;
  boardTitle: string;
  invitedBy: string;
  invitedByName: string;
  invitedEmail: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  expiresAt: Date;
}

export interface Analytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyProgress: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}