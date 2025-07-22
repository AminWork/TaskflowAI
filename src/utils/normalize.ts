import { KanbanBoard, BoardMember, Task } from '../types';

export function normalizeBoard(apiBoard: any): KanbanBoard {
  return {
    id: apiBoard.id.toString(),
    title: apiBoard.title,
    description: apiBoard.description,
    createdBy: apiBoard.created_by.toString(),
    createdAt: new Date(apiBoard.created_at),
    updatedAt: new Date(apiBoard.updated_at),
    isPublic: apiBoard.is_public,
    settings: {
      allowGuestAccess: apiBoard.settings.allow_guest_access,
      requireApprovalForNewMembers: apiBoard.settings.require_approval_for_new_members,
      defaultMemberRole: apiBoard.settings.default_member_role,
    },
    members: apiBoard.members.map((m: any): BoardMember => ({
      userId: m.user_id.toString(),
      email: m.email,
      name: m.name,
      avatar: m.avatar,
      role: m.role,
      joinedAt: new Date(m.joined_at),
      permissions: m.permissions,
    })),
  };
}

export function normalizeUser(apiUser: any) {
  return {
    id: apiUser.id.toString(),
    email: apiUser.email,
    name: apiUser.name,
    avatar: apiUser.avatar,
    createdAt: new Date(apiUser.created_at),
  };
}

export function normalizeInvitation(apiInv: any) {
  return {
    id: apiInv.id.toString(),
    boardId: apiInv.board_id ? apiInv.board_id.toString() : apiInv.board.id.toString(),
    boardTitle: apiInv.board_title || apiInv.board.title,
    invitedBy: apiInv.invited_by ? apiInv.invited_by.toString() : apiInv.inviter.id.toString(),
    invitedByName: apiInv.invited_by_name || apiInv.inviter.name,
    invitedEmail: apiInv.invited_email,
    role: apiInv.role,
    status: apiInv.status,
    createdAt: new Date(apiInv.created_at),
    expiresAt: new Date(apiInv.expires_at),
  };
}

export function normalizeTask(apiTask: any): Task {
  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    description: apiTask.description,
    priority: apiTask.priority,
    category: apiTask.category,
    status: apiTask.status,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
    tags: apiTask.tags || [],
    estimatedHours: apiTask.estimated_hours,
    actualHours: apiTask.actual_hours,
    assignee: apiTask.assignee_id ? apiTask.assignee_id.toString() : undefined,
  };
} 