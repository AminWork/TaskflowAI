import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, FileText, Clock, User, Plus } from 'lucide-react';
import { Task, BoardMember } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { AssigneeSelector } from './AssigneeSelector';

interface TaskFormProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  defaultStatus?: Task['status'];
  boardMembers?: BoardMember[];
}

export function TaskForm({ task, isOpen, onClose, onSave, defaultStatus = 'todo', boardMembers = [] }: TaskFormProps) {
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<Task['status']>(defaultStatus);
  const [assignee, setAssignee] = useState<string | undefined>();
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setCategory(task.category);
      setTags(task.tags);
      setStatus(task.status);
      setAssignee(task.assignee);
      setEstimatedHours(task.estimatedHours);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('');
      setTags([]);
      setTagInput('');
      setStatus(defaultStatus);
      setAssignee(undefined);
      setEstimatedHours(undefined);
    }
  }, [task, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category.trim(),
      tags,
      status,
      assignee,
      estimatedHours,
    });

    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300"
      >
        <div className="p-6">
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {task ? t('task.editTask') : t('task.createTask')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
                <FileText size={14} />
                {t('task.title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('form.enterTitle')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('task.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder={t('form.addDescription')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('task.priority')}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="low">{t('priority.low')}</option>
                  <option value="medium">{t('priority.medium')}</option>
                  <option value="high">{t('priority.high')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('task.status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="todo">{t('task.todo')}</option>
                  <option value="inprogress">{t('task.inprogress')}</option>
                  <option value="done">{t('task.done')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('task.category')}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('task.category')}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
                <User size={14} />
                {t('task.assignTo')}
              </label>
              <AssigneeSelector
                members={boardMembers}
                selectedAssignee={assignee}
                onAssigneeChange={setAssignee}
                placeholder={t('form.selectAssignee')}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
                <Clock size={14} />
                {t('task.estimatedHours')}
              </label>
              <input
                type="number"
                value={estimatedHours || ''}
                onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('task.tags')}
              </label>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} gap-2 mb-2`}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('task.tags')}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('task.addTag')}
                </button>
              </div>
              {tags.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-200 dark:border-blue-700`}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-3 pt-4`}>
              <button
                type="submit"
                className={`flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
              >
                <Save size={16} />
                <span>{t('form.save')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('form.cancel')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}