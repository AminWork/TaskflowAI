import React from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fa' ? 'en' : 'fa');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 rtl:space-x-reverse"
      title={t('language.switch')}
    >
      <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {language === 'fa' ? 'فا' : 'EN'}
      </span>
    </motion.button>
  );
} 