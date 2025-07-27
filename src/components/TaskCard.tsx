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
  
  const priorityStyles = {
    low: 'text-slate-500 dark:text-slate-400',
    medium: 'text-yellow-600 dark:text-yellow-400 font-semibold',
    high: 'text-red-600 dark:text-red-500 font-bold',
  };

  const assignedMember = task.assignee ? boardMembers.find(m => m.userId === task.assignee) : null;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, task);
  };

  return (
    <div draggable onDragStart={handleDragStart} className="cursor-move">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700/80 p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group relative hover:-translate-y-1"
      >
        <div className="relative">
          {/* Header */}
          <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight pr-2">
              {task.title}
            </h3>
            <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700/50 rounded-md transition-all"
                title={t('task.editTask')}
              >
                <Edit size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700/50 rounded-md transition-all"
                title={t('common.delete')}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-teal-100/70 dark:bg-teal-900/70 text-teal-800 dark:text-teal-200 text-xs rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className={`flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              {assignedMember ? (
                <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                  <img
                    src={assignedMember.avatar || `https://i.pravatar.cc/24?u=${assignedMember.userId}`}
                    alt={assignedMember.name}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{assignedMember.name}</span>
                </div>
              ) : (
                <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 text-slate-400 dark:text-slate-500`}>
                  <User size={14} />
                  <span>{t('task.unassigned')}</span>
                </div>
              )}
            </div>
            
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
              {task.estimatedHours && (
                <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1.5`}>
                  <Clock size={14} />
                  <span className="font-medium">{task.estimatedHours}h</span>
                </div>
              )}
              <div className={`px-2 py-1 rounded-md text-xs font-medium ${priorityStyles[task.priority]}`}>
                {t(`priority.${task.priority}`)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}