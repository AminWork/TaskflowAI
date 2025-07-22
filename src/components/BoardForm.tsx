import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Users, Globe, Lock } from 'lucide-react';
import { KanbanBoard } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BoardFormProps {
  board?: KanbanBoard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description?: string) => void;
}

export function BoardForm({ board, isOpen, onClose, onSave }: BoardFormProps) {
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [board, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, description || undefined);
    if (!board) {
      setTitle('');
      setDescription('');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {board ? t('board.edit') : t('dashboard.newBoard')}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('task.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder={t('form.addDescription')}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 text-blue-800 dark:text-blue-200 mb-2`}>
              <Lock size={16} />
              <span className="font-medium">{t('board.privacySettings')}</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('board.privacyNote')}
            </p>
          </div>

          <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-3 pt-4`}>
            <button
              type="submit"
              className={`flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
            >
              <Save size={16} />
              <span>{board ? t('form.saveChanges') : t('board.createBoard')}</span>
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
      </motion.div>
    </div>
  );
}