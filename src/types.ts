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
  defaultMemberRole: 'admin' | 'member' | 'viewer';
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

// Chat-related types
export interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  sender: 'user' | 'ai';
  userName: string;
  avatar?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
}

export interface ChatMember {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  joinedAt: string;
  isOnline: boolean;
}

export interface SearchUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

// Private message types
export interface PrivateMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
  recipient: User;
}

export interface PrivateConversation {
  userId: string;
  userName: string;
  userEmail: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
} 