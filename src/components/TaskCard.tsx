import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Clock, User } from 'lucide-react';
import { Task, BoardMember } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  boardMembers?: BoardMember[];
}

export function TaskCard({ task, onDelete, onEdit, onDragStart, boardMembers = [] }: TaskCardProps) {
  const { t, isRTL } = useLanguage();
  
  const priorityColors = {
    low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  };

  const assignedMember = task.assignee ? boardMembers.find(m => m.userId === task.assignee) : null;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, task);
  };

  return (
    <div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 cursor-move hover:shadow-xl transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 animate-in slide-in-from-bottom-4 fade-in"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        {/* Header */}
        <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight pr-2">
            {task.title}
          </h3>
          <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(task)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
              title={t('task.editTask')}
            >
              <Edit size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              title={t('common.delete')}
            >
              <Trash2 size={14} />
            </motion.button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Priority and Category */}
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 mb-4`}>
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${priorityColors[task.priority]}`}>
            {t(`priority.${task.priority}`)}
          </span>
          {task.category && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              {task.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className={`flex flex-wrap gap-1 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-200 dark:border-blue-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            {assignedMember ? (
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <img
                  src={assignedMember.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face`}
                  alt={assignedMember.name}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                />
                <span className="font-medium">{assignedMember.name}</span>
              </div>
            ) : (
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1 text-gray-400 dark:text-gray-500`}>
                <User size={12} />
                <span>{t('task.unassigned')}</span>
              </div>
            )}
          </div>
          
          {task.estimatedHours && (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
              <Clock size={12} />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}