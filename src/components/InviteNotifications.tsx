import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardInvitation } from '../types';
import { Mail, Clock, Check, X, Users, Crown, Shield, Eye } from 'lucide-react';

interface InviteNotificationsProps {
  invitations: BoardInvitation[];
  onAcceptInvitation: (invitationId: string) => void;
  onDeclineInvitation: (invitationId: string) => void;
}

export function InviteNotifications({ 
  invitations, 
  onAcceptInvitation, 
  onDeclineInvitation 
}: InviteNotificationsProps) {
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-blue-500" />;
      case 'member': return <Users size={14} className="text-green-500" />;
      case 'viewer': return <Eye size={14} className="text-gray-500" />;
      default: return null;
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  if (pendingInvitations.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Board Invitations ({pendingInvitations.length})
            </h3>
            <p className="text-sm text-gray-600">
              You've been invited to collaborate on these boards
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {pendingInvitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{invitation.boardTitle}</h4>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(invitation.role)}
                        <span className="text-sm text-gray-600 capitalize">{invitation.role}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Invited by {invitation.invitedByName}</span>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{getTimeRemaining(invitation.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAcceptInvitation(invitation.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
                    >
                      <Check size={14} />
                      <span>Accept</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDeclineInvitation(invitation.id)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 