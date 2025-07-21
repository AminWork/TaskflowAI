import { useState, useEffect } from 'react';
import { KanbanBoard, BoardInvitation, User, Permission } from '../types';
import { normalizeBoard } from '../utils/normalize';
import { useLocalStorage } from './useLocalStorage';

export function useBoards(currentUser: User | null, token: string | null) {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [invitations, setInvitations] = useState<BoardInvitation[]>([]);
  const [currentBoard, setCurrentBoard] = useState<KanbanBoard | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch boards from API
  const fetchBoards = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/boards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(data.map((b: any) => normalizeBoard(b)));
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch invitations from API
  const fetchInvitations = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/invitations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  // Load data on mount and when token changes
  useEffect(() => {
    // reset boards when user or token changes
    setBoards([]);
    setInvitations([]);
    setCurrentBoard(null);
    if (token) {
      fetchBoards();
      fetchInvitations();
    }
  }, [token, currentUser]);

  const createBoard = async (title: string, description?: string): Promise<KanbanBoard | null> => {
    if (!currentUser || !token) return null;

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        const newBoardApi = await response.json();
        const newBoard = normalizeBoard(newBoardApi);
        setBoards(prev => [...prev, newBoard]);
        setCurrentBoard(newBoard);
        return newBoard;
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    }
    return null;
  };

  const inviteUser = async (boardId: number, email: string, role: 'admin' | 'member' | 'viewer') => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        // Refresh invitations
        fetchInvitations();
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  const acceptInvitation = async (invitationId: number) => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh boards and invitations
        fetchBoards();
        fetchInvitations();
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const declineInvitation = async (invitationId: number) => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh invitations
        fetchInvitations();
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };

  const removeMember = async (boardId: string, userId: string) => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh boards
        fetchBoards();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const updateMemberRole = async (boardId: string, userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Refresh boards
        fetchBoards();
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const hasPermission = (boardId: string, action: Permission['action']): boolean => {
    const board = boards.find(b => b.id === boardId);
    if (!board || !currentUser) return false;

    const member = board.members.find(m => m.userId === currentUser.id);
    if (!member) return false;

    return member.permissions.some(p => p.action === action && p.granted);
  };

  const deleteBoard = async (boardId: string) => {
    if (!currentUser || !token) return;

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBoards(prev => prev.filter(b => b.id !== boardId));
        if (currentBoard?.id === boardId) {
          setCurrentBoard(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  return {
    boards,
    invitations,
    currentBoard,
    isLoading,
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