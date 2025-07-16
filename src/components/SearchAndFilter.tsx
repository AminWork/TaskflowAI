import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Task } from '../types';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: Task['priority'] | 'all';
  onPriorityFilterChange: (priority: Task['priority'] | 'all') => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categories: string[];
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
}: SearchAndFilterProps) {
  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || categoryFilter;

  const clearFilters = () => {
    onSearchChange('');
    onPriorityFilterChange('all');
    onCategoryFilterChange('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as Task['priority'] | 'all')}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
              title="Clear filters"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}