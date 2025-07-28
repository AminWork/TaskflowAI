import React, { useState, useMemo } from 'react';
import { KanbanBoard, Task } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import { Analytics as AnalyticsView } from './Analytics';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsPageProps {
  boards: KanbanBoard[];
  tasks: Task[]; // all tasks from all boards user belongs to
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ boards, tasks }) => {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>('general');

  // Derive tasks for current selection
  const displayedTasks = useMemo(() => {
    if (selectedId === 'general') return tasks;
    return tasks.filter((t: any) => t.boardId === selectedId);
  }, [tasks, selectedId]);

  const analytics = useAnalytics(displayedTasks);

  return (
    <div className="flex w-full">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2 bg-white dark:bg-gray-800">
        <button
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            selectedId === 'general'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedId('general')}
        >
          Overview
        </button>
        {boards.map((b) => (
          <button
            key={b.id}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedId === b.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
            onClick={() => setSelectedId(b.id)}
          >
            {b.title}
          </button>
        ))}
      </aside>

      {/* Analytics content */}
      <div className="flex-1 p-6 overflow-auto">
        <AnalyticsView analytics={analytics} />
      </div>
    </div>
  );
};
