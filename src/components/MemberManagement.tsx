import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard, BoardInvitation, User } from '../types';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Crown, 
  Shield, 
  Eye, 
  MoreVertical, 
  Trash2,
  Check,
  X,
  Clock
} from 'lucide-react';

interface MemberManagementProps {
  board: KanbanBoard;
  invitations: BoardInvitation[];
  currentUser: User;
  onInviteUser: (email: string, role: 'admin' | 'member' | 'viewer') => void;
  onRemoveMember: (userId: string) => void;
  onUpdateRole: (userId: string, role: 'admin' | 'member' | 'viewer') => void;
  onAcceptInvitation: (invitationId: string) => void;
  onDeclineInvitation: (invitationId: string) => void;
  hasPermission: (action: string) => boolean;
}

export function MemberManagement({
  board,
  invitations,
  currentUser,
  onInviteUser,
  onRemoveMember,
  onUpdateRole,
  onAcceptInvitation,
  onDeclineInvitation,
  hasPermission,
}: MemberManagementProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={16} className="text-yellow-500" />;
      case 'admin': return <Shield size={16} className="text-blue-500" />;
      case 'member': return <Users size={16} className="text-green-500" />;
      case 'viewer': return <Eye size={16} className="text-gray-500" />;
      default: return null;
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      onInviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setIsInviteOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const boardInvitations = invitations.filter(inv => inv.boardId === board.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
            <p className="text-gray-600">{board.members.length} members</p>
          </div>
        </div>
        
        {hasPermission('invite_users') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsInviteOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </motion.button>
        )}
      </div>

      {/* Pending Invitations */}
      {boardInvitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-medium text-yellow-800 mb-3 flex items-center space-x-2">
            <Clock size={16} />
            <span>Pending Invitations</span>
          </h4>
          <div className="space-y-2">
            {boardInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{invitation.invitedEmail}</p>
                    <p className="text-sm text-gray-500 capitalize">Invited as {invitation.role}</p>
                  </div>
                </div>
                {invitation.invitedEmail === currentUser.email && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAcceptInvitation(invitation.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => onDeclineInvitation(invitation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {board.members.map((member) => (
            <div key={member.userId} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={member.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                    alt={member.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                    {getRoleIcon(member.role)}
                    <span className="text-sm font-medium capitalize">{member.role}</span>
                  </div>
                  
                  {hasPermission('manage_board') && member.role !== 'owner' && member.userId !== currentUser.id && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === member.userId ? null : member.userId)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === member.userId && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[150px]"
                          >
                            <button
                              onClick={() => {
                                onUpdateRole(member.userId, 'admin');
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => {
                                onUpdateRole(member.userId, 'member');
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              Make Member
                            </button>
                            <button
                              onClick={() => {
                                onUpdateRole(member.userId, 'viewer');
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              Make Viewer
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                onRemoveMember(member.userId);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Invite Team Member</h3>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter email address..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="viewer">Viewer - Can view tasks only</option>
                    <option value="member">Member - Can create and edit tasks</option>
                    <option value="admin">Admin - Full access except board deletion</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}