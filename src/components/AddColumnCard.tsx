import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface AddColumnCardProps {
  onAddColumn: (title: string) => void;
}

export const AddColumnCard: React.FC<AddColumnCardProps> = ({ onAddColumn }) => {
  const { t } = useLanguage();

  const handleClick = () => {
    const title = prompt(t('column.enterName') || 'Enter column name');
    if (!title) return;
    onAddColumn(title.trim());
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="flex flex-col items-center justify-center min-h-[200px] p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300"
    >
      <Plus size={32} />
      <span className="mt-2 font-semibold">{t('column.addColumn')}</span>
    </motion.button>
  );
};
