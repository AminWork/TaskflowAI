import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardMember } from '../types';
import { User, ChevronDown, UserX, Crown, Shield, Eye, Users } from 'lucide-react';

interface AssigneeSelectorProps {
  members: BoardMember[];
  selectedAssignee?: string;
  onAssigneeChange: (assigneeId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AssigneeSelector({
  members,
  selectedAssignee,
  onAssigneeChange,
  placeholder = "Select assignee...",
  disabled = false,
  className = ""
}: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedMember = members.find(m => m.userId === selectedAssignee);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={12} className="text-yellow-500" />;
      case 'admin': return <Shield size={12} className="text-blue-500" />;
      case 'member': return <Users size={12} className="text-green-500" />;
      case 'viewer': return <Eye size={12} className="text-gray-500" />;
      default: return null;
    }
  };

  const handleSelect = (assigneeId: string | undefined) => {
    onAssigneeChange(assigneeId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-all ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        } ${isOpen ? 'border-blue-500' : 'border-gray-200'}`}
      >
        <div className="flex items-center space-x-2 flex-1">
          {selectedMember ? (
            <>
              <img
                src={selectedMember.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                alt={selectedMember.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-900">{selectedMember.name}</span>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(selectedMember.role)}
                  <span className="text-xs text-gray-500 capitalize">{selectedMember.role}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">{placeholder}</span>
            </>
          )}
        </div>
        {!disabled && <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-60 overflow-y-auto"
          >
            {/* Unassigned Option */}
            <motion.button
              type="button"
              onClick={() => handleSelect(undefined)}
              whileHover={{ backgroundColor: '#f8fafc' }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <UserX size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Unassigned</span>
              {!selectedAssignee && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </motion.button>

            {/* Member Options */}
            {members.map((member) => (
              <motion.button
                key={member.userId}
                type="button"
                onClick={() => handleSelect(member.userId)}
                whileHover={{ backgroundColor: '#f8fafc' }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <img
                  src={member.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                  alt={member.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    {getRoleIcon(member.role)}
                  </div>
                  <span className="text-xs text-gray-500">{member.email}</span>
                </div>
                {selectedAssignee === member.userId && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 