import { useState, useEffect } from 'react';
import { KanbanBoard, BoardMember, BoardInvitation, User, Permission } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useBoards(currentUser: User | null) {
  const [boards, setBoards] = useLocalStorage<KanbanBoard[]>('kanban-boards', []);
  const [invitations, setInvitations] = useLocalStorage<BoardInvitation[]>('board-invitations', []);
  const [currentBoard, setCurrentBoard] = useState<KanbanBoard | null>(null);

  // Get boards where user is a member
  const userBoards = boards.filter(board => 
    board.members.some(member => member.userId === currentUser?.id)
  );

  // Get pending invitations for current user
  const userInvitations = invitations.filter(inv => 
    inv.invitedEmail === currentUser?.email && inv.status === 'pending'
  );

  const createBoard = (title: string, description?: string): KanbanBoard => {
    if (!currentUser) throw new Error('User must be logged in');

    const defaultPermissions: Permission[] = [
      { action: 'create_task', granted: true },
      { action: 'edit_task', granted: true },
      { action: 'delete_task', granted: true },
      { action: 'move_task', granted: true },
      { action: 'invite_users', granted: true },
      { action: 'manage_board', granted: true },
    ];

    const newBoard: KanbanBoard = {
      id: Date.now().toString(),
      title,
      description,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      members: [{
        userId: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: 'owner',
        joinedAt: new Date(),
        permissions: defaultPermissions,
      }],
      settings: {
        allowGuestAccess: false,
        requireApprovalForNewMembers: false,
        defaultMemberRole: 'member',
      },
    };

    setBoards(prev => [...prev, newBoard]);
    setCurrentBoard(newBoard);
    return newBoard;
  };

  const inviteUser = (boardId: string, email: string, role: 'admin' | 'member' | 'viewer') => {
    if (!currentUser) return;

    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    // Check if user has permission to invite
    const currentMember = board.members.find(m => m.userId === currentUser.id);
    if (!currentMember?.permissions.find(p => p.action === 'invite_users')?.granted) {
      throw new Error('You do not have permission to invite users');
    }

    // Check if user is already a member
    if (board.members.some(m => m.email === email)) {
      throw new Error('User is already a member of this board');
    }

    // Check if invitation already exists
    if (invitations.some(inv => inv.boardId === boardId && inv.invitedEmail === email && inv.status === 'pending')) {
      throw new Error('Invitation already sent to this user');
    }

    const invitation: BoardInvitation = {
      id: Date.now().toString(),
      boardId,
      boardTitle: board.title,
      invitedBy: currentUser.id,
      invitedByName: currentUser.name,
      invitedEmail: email,
      role,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    setInvitations(prev => [...prev, invitation]);
  };

  const acceptInvitation = (invitationId: string) => {
    if (!currentUser) return;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation || invitation.status !== 'pending') return;

    // Add user to board
    const board = boards.find(b => b.id === invitation.boardId);
    if (!board) return;

    const memberPermissions: Permission[] = [
      { action: 'create_task', granted: true },
      { action: 'edit_task', granted: true },
      { action: 'delete_task', granted: invitation.role !== 'viewer' },
      { action: 'move_task', granted: true },
      { action: 'invite_users', granted: invitation.role === 'admin' },
      { action: 'manage_board', granted: invitation.role === 'admin' },
    ];

    const newMember: BoardMember = {
      userId: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: invitation.role,
      joinedAt: new Date(),
      permissions: memberPermissions,
    };

    setBoards(prev => prev.map(b => 
      b.id === invitation.boardId 
        ? { ...b, members: [...b.members, newMember], updatedAt: new Date() }
        : b
    ));

    // Update invitation status
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId 
        ? { ...inv, status: 'accepted' as const }
        : inv
    ));
  };

  const declineInvitation = (invitationId: string) => {
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId 
        ? { ...inv, status: 'declined' as const }
        : inv
    ));
  };

  const removeMember = (boardId: string, userId: string) => {
    if (!currentUser) return;

    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    // Check permissions
    const currentMember = board.members.find(m => m.userId === currentUser.id);
    if (!currentMember?.permissions.find(p => p.action === 'manage_board')?.granted) {
      throw new Error('You do not have permission to remove members');
    }

    // Cannot remove owner
    const memberToRemove = board.members.find(m => m.userId === userId);
    if (memberToRemove?.role === 'owner') {
      throw new Error('Cannot remove board owner');
    }

    setBoards(prev => prev.map(b => 
      b.id === boardId 
        ? { ...b, members: b.members.filter(m => m.userId !== userId), updatedAt: new Date() }
        : b
    ));
  };

  const updateMemberRole = (boardId: string, userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!currentUser) return;

    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    // Check permissions
    const currentMember = board.members.find(m => m.userId === currentUser.id);
    if (!currentMember?.permissions.find(p => p.action === 'manage_board')?.granted) {
      throw new Error('You do not have permission to update member roles');
    }

    const memberPermissions: Permission[] = [
      { action: 'create_task', granted: true },
      { action: 'edit_task', granted: true },
      { action: 'delete_task', granted: newRole !== 'viewer' },
      { action: 'move_task', granted: true },
      { action: 'invite_users', granted: newRole === 'admin' },
      { action: 'manage_board', granted: newRole === 'admin' },
    ];

    setBoards(prev => prev.map(b => 
      b.id === boardId 
        ? {
            ...b,
            members: b.members.map(m => 
              m.userId === userId 
                ? { ...m, role: newRole, permissions: memberPermissions }
                : m
            ),
            updatedAt: new Date()
          }
        : b
    ));
  };

  const hasPermission = (boardId: string, action: Permission['action']): boolean => {
    if (!currentUser) return false;

    const board = boards.find(b => b.id === boardId);
    if (!board) return false;

    const member = board.members.find(m => m.userId === currentUser.id);
    if (!member) return false;

    return member.permissions.find(p => p.action === action)?.granted || false;
  };

  const deleteBoard = (boardId: string) => {
    if (!currentUser) return;

    const board = boards.find(b => b.id === boardId);
    if (!board || board.createdBy !== currentUser.id) {
      throw new Error('Only board owner can delete the board');
    }

    setBoards(prev => prev.filter(b => b.id !== boardId));
    setInvitations(prev => prev.filter(inv => inv.boardId !== boardId));
    
    if (currentBoard?.id === boardId) {
      setCurrentBoard(userBoards.length > 1 ? userBoards[0] : null);
    }
  };

  return {
    boards: userBoards,
    currentBoard,
    invitations: userInvitations,
    setCurrentBoard,
    createBoard,
    inviteUser,
    acceptInvitation,
    declineInvitation,
    removeMember,
    updateMemberRole,
    hasPermission,
    deleteBoard,
  };
}