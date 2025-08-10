import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Users, Crown, Shield, Eye, Send, Plus, Trash2 } from 'lucide-react';
import { KanbanBoard } from '../types';

interface QuickInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: KanbanBoard[];
  onInviteUser: (boardId: string, email: string, role: 'admin' | 'member' | 'viewer') => Promise<void>;
  currentBoardId?: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  boardId: string;
}

export function QuickInviteModal({ 
  isOpen, 
  onClose, 
  boards, 
  onInviteUser, 
  currentBoardId 
}: QuickInviteModalProps) {
  const [invites, setInvites] = useState<InviteItem[]>([
    {
      id: '1',
      email: '',
      role: 'member',
      boardId: currentBoardId || (boards.length > 0 ? boards[0].id : ''),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-blue-500" />;
      case 'member': return <Users size={14} className="text-green-500" />;
      case 'viewer': return <Eye size={14} className="text-gray-500" />;
      default: return null;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Can manage board and all tasks';
      case 'member': return 'Can create and edit tasks';
      case 'viewer': return 'Can view tasks only';
      default: return '';
    }
  };

  const addInvite = () => {
    const newInvite: InviteItem = {
      id: Date.now().toString(),
      email: '',
      role: 'member',
      boardId: currentBoardId || (boards.length > 0 ? boards[0].id : ''),
    };
    setInvites([...invites, newInvite]);
  };

  const removeInvite = (id: string) => {
    if (invites.length > 1) {
      setInvites(invites.filter(invite => invite.id !== id));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updateInvite = (id: string, field: keyof InviteItem, value: string) => {
    setInvites(invites.map(invite => 
      invite.id === id ? { ...invite, [field]: value } : invite
    ));
    
    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all invites
    const newErrors: Record<string, string> = {};
    const validInvites = invites.filter(invite => {
      if (!invite.email.trim()) {
        newErrors[invite.id] = 'Email is required';
        return false;
      }
      if (!validateEmail(invite.email)) {
        newErrors[invite.id] = 'Invalid email format';
        return false;
      }
      if (!invite.boardId) {
        newErrors[invite.id] = 'Please select a board';
        return false;
      }
      return true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Send all invitations
      await Promise.all(
        validInvites.map(invite => 
          onInviteUser(invite.boardId, invite.email, invite.role)
        )
      );
      
      // Reset form and close
      setInvites([{
        id: '1',
        email: '',
        role: 'member',
        boardId: currentBoardId || (boards.length > 0 ? boards[0].id : ''),
      }]);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedBoard = (boardId: string) => {
    return boards.find(b => b.id === boardId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invite Team Members</h2>
                <p className="text-gray-600">Add people to collaborate on your boards</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invites List */}
            <div className="space-y-4">
              {invites.map((invite, index) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-700">Invitation {index + 1}</span>
                    </div>
                    {invites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvite(invite.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Email */}
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={invite.email}
                        onChange={(e) => updateInvite(invite.id, 'email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors[invite.id] ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="user@example.com"
                      />
                      {errors[invite.id] && (
                        <p className="text-red-500 text-sm mt-1">{errors[invite.id]}</p>
                      )}
                    </div>

                    {/* Board */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-900 mb-2">
                        Board
                      </label>
                      <select
                        value={invite.boardId}
                        onChange={(e) => updateInvite(invite.id, 'boardId', e.target.value)}
                        className="w-full px-3 py-2 bg-white text-gray-800 dark:text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {boards.map(board => (
                          <option key={board.id} value={board.id}>
                            {board.title}
                          </option>
                        ))}
                      </select>
                      {invite.boardId && (
                        <p className="text-xs text-gray-600 mt-1">
                          {getSelectedBoard(invite.boardId)?.members.length} members
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-900 mb-2">
                        Role
                      </label>
                      <select
                        value={invite.role}
                        onChange={(e) => updateInvite(invite.id, 'role', e.target.value as 'admin' | 'member' | 'viewer')}
                        className="w-full px-3 py-2 bg-white text-gray-800 dark:text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex items-center space-x-1 mt-1">
                        {getRoleIcon(invite.role)}
                        <p className="text-xs text-gray-600">
                          {getRoleDescription(invite.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Another Invite */}
            <div className="text-center">
              <button
                type="button"
                onClick={addInvite}
                className="inline-flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>Add Another Invitation</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send size={16} />
                <span>{isLoading ? 'Sending...' : `Send ${invites.length} Invitation${invites.length > 1 ? 's' : ''}`}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How invitations work:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Invited users will receive an email notification</li>
                    <li>• They can accept or decline the invitation</li>
                    <li>• Invitations expire after 7 days</li>
                    <li>• You can manage invitations in the Members tab</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 