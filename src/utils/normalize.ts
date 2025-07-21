import { KanbanBoard, BoardMember } from '../types';

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