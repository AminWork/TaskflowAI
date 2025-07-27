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
      className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 min-h-[700px] flex flex-col border border-slate-200/50 dark:border-slate-700/50 shadow-lg transition-colors duration-300"
    >
      <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{column.title}</h2>
          <motion.span
            key={tasks.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 text-sm px-3 py-1 rounded-full font-semibold"
          >
            {tasks.length}
          </motion.span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAddTask(column.status)}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-white hover:bg-teal-500 rounded-full transition-all duration-300 hover:shadow-lg"
          title={t('task.addTask')}
        >
          <Plus size={20} />
        </motion.button>
      </div>
      
      <div
        className="flex-1 space-y-4 pt-2 -mx-2 px-2 overflow-y-auto"
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
            className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/20 dark:bg-slate-800/20 transition-colors duration-300"
          >
            <p className="text-center px-4 font-medium">
              {t('task.dropHere')}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}