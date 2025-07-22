import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Column, Task, BoardMember } from '../types';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 min-h-[700px] flex flex-col border border-gray-200/50 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${column.color} shadow-lg`}></div>
          <h2 className="font-bold text-gray-900 text-lg">{column.title}</h2>
          <motion.span
            key={tasks.length}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full font-bold shadow-sm"
          >
            {tasks.length}
          </motion.span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAddTask(column.status)}
          className="p-3 text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
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
            className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50"
          >
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <p>Drop tasks here or click + to add</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}