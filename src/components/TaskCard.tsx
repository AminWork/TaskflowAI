import React from 'react';
import { motion } from 'framer-motion';
import { Task, BoardMember } from '../types';
import { Calendar, Flag, Tag, Trash2, Edit3, User, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  boardMembers?: BoardMember[];
}

export function TaskCard({ task, onDelete, onEdit, onDragStart, boardMembers = [] }: TaskCardProps) {
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const assignedMember = task.assignee ? boardMembers.find(m => m.userId === task.assignee) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5 cursor-move hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{task.title}</h3>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {task.description && (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{task.description}</p>
        )}
        
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50"
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="space-y-3">
          {/* Assignee and Time */}
          <div className="flex items-center justify-between">
            {assignedMember ? (
              <div className="flex items-center space-x-2">
                <img
                  src={assignedMember.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face`}
                  alt={assignedMember.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-gray-700">{assignedMember.name}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <User size={12} />
                <span>Unassigned</span>
              </div>
            )}
            
            {task.estimatedHours && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <Clock size={12} />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>

          {/* Priority and Date */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${priorityColors[task.priority]}`}>
              <Flag size={12} className="mr-1" />
              {task.priority}
            </span>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar size={12} className="mr-1" />
              {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}