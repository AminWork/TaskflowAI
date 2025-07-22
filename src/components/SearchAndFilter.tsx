import React from 'react';
import { Search, Filter, X, User } from 'lucide-react';
import { Task, BoardMember } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: Task['priority'] | 'all';
  onPriorityFilterChange: (priority: Task['priority'] | 'all') => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categories: string[];
  assigneeFilter: string;
  onAssigneeFilterChange: (assignee: string) => void;
  boardMembers?: BoardMember[];
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  assigneeFilter,
  onAssigneeFilterChange,
  boardMembers = [],
}: SearchAndFilterProps) {
  const { t, isRTL } = useLanguage();
  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || categoryFilter || assigneeFilter;

  const clearFilters = () => {
    onSearchChange('');
    onPriorityFilterChange('all');
    onCategoryFilterChange('');
    onAssigneeFilterChange('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
      <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className="flex-1 relative">
          <Search size={18} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          />
        </div>

        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <Filter size={16} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as Task['priority'] | 'all')}
              className={`${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none`}
            >
              <option value="all">{t('search.allPriorities')}</option>
              <option value="high">{t('search.highPriority')}</option>
              <option value="medium">{t('search.mediumPriority')}</option>
              <option value="low">{t('search.lowPriority')}</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="">{t('search.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="relative">
            <User size={16} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className={`${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none`}
            >
              <option value="">{t('search.allAssignees')}</option>
              <option value="unassigned">{t('task.unassigned')}</option>
              {boardMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
              title={t('search.clearFilters')}
            >
              <X size={16} />
              <span className="hidden sm:inline">{t('search.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}