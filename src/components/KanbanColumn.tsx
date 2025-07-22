import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Column, Task, BoardMember } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (status: Task['status']) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Task['status']) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  boardMembers?: BoardMember[];
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onDragOver,
  onDrop,
  onDragStart,
  boardMembers = [],
}: KanbanColumnProps) {
  const { t, isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 min-h-[700px] flex flex-col border border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-colors duration-300"
    >
      <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
          <div className={`w-4 h-4 rounded-full ${column.color} shadow-lg`}></div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{column.title}</h2>
          <motion.span
            key={tasks.length}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full font-bold shadow-sm"
          >
            {tasks.length}
          </motion.span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAddTask(column.status)}
          className="p-3 text-gray-400 dark:text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          title={t('task.addTask')}
        >
          <Plus size={18} />
        </motion.button>
      </div>
      
      <div
        className="flex-1 space-y-4"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.status)}
      >
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onDragStart={onDragStart}
              boardMembers={boardMembers}
            />
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50 transition-colors duration-300"
          >
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-center px-4">
              {t('task.dropHere')}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}