import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface AddColumnCardProps {
  onAddColumn: (title: string) => void;
}

export const AddColumnCard: React.FC<AddColumnCardProps> = ({ onAddColumn }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setTitle('');
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddColumn(title.trim());
    closeModal();
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openModal}
        className="flex flex-col items-center justify-center min-h-[200px] p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300"
      >
        <Plus size={32} />
        <span className="mt-2 font-semibold">{t('column.addColumn')}</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-96 shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                {t('column.addColumn')}
              </h3>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.enterTitle') || 'Enter column name'}
                className="w-full px-4 py-2 border rounded-md mb-4 bg-transparent border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  {t('form.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition"
                >
                  {t('column.addColumn') || 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
