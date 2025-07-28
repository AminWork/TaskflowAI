import { useMemo } from 'react';
import { Task, Analytics } from '../types';

export function useAnalytics(tasks: Task[]): Analytics {
  return useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average completion time (mock calculation)
    const completedTasksWithTime = tasks.filter(t => t.status === 'done');
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((acc, task) => {
          const timeDiff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
          return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedTasksWithTime.length
      : 0;

    // Calculate productivity score
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.4) + 
      (Math.max(0, 100 - averageCompletionTime * 10) * 0.3) + 
      (Math.min(100, (completedTasks / 7) * 20) * 0.3)
    ));

    // Generate weekly progress data
    const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });
      
      const completedOnDay = tasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate.toDateString() === date.toDateString() && task.status === 'done';
      });

      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedOnDay.length,
        created: dayTasks.length,
      };
    });

    // Category breakdown
    const categoryMap = new Map<string, number>();
    tasks.forEach(task => {
      if (task.category) {
        categoryMap.set(task.category, (categoryMap.get(task.category) || 0) + 1);
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
    }));

    // Priority distribution
    const priorityMap = new Map<string, number>();
    tasks.forEach(task => {
      priorityMap.set(task.priority, (priorityMap.get(task.priority) || 0) + 1);
    });

    const priorityDistribution = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      name: priority,
      value: count,
      percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
    }));

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      averageCompletionTime,
      productivityScore,
      weeklyProgress,
      categoryBreakdown,
      priorityDistribution,
    };
  }, [tasks]);
}