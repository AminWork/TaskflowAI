import { useState, useEffect } from 'react';
import { Task } from '../types';
import { normalizeTask } from '../utils/normalize';

export function useTasks(boardId: string | null, token: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!boardId || !token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.map((t: any) => normalizeTask(t)));
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks when board or token changes
  useEffect(() => {
    setTasks([]);
    if (boardId && token) {
      fetchTasks();
    }
  }, [boardId, token]);

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    if (!boardId || !token) return null;

    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          category: taskData.category,
          status: taskData.status,
          tags: taskData.tags,
          estimated_hours: taskData.estimatedHours,
          assignee_id: taskData.assignee ? parseInt(taskData.assignee) : null,
        }),
      });

      if (response.ok) {
        const newTaskApi = await response.json();
        const newTask = normalizeTask(newTaskApi);
        setTasks(prev => [...prev, newTask]);
        return newTask;
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
    return null;
  };

  const updateTask = async (taskId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          category: taskData.category,
          status: taskData.status,
          tags: taskData.tags,
          estimated_hours: taskData.estimatedHours,
          actual_hours: taskData.actualHours,
          assignee_id: taskData.assignee ? parseInt(taskData.assignee) : null,
        }),
      });

      if (response.ok) {
        const updatedTaskApi = await response.json();
        const updatedTask = normalizeTask(updatedTaskApi);
        setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
        return updatedTask;
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
    return null;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        return true;
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
    return false;
  };

  const moveTask = async (taskId: string, newStatus: Task['status']): Promise<Task | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const movedTaskApi = await response.json();
        const movedTask = normalizeTask(movedTaskApi);
        setTasks(prev => prev.map(task => task.id === taskId ? movedTask : task));
        return movedTask;
      }
    } catch (error) {
      console.error('Failed to move task:', error);
    }
    return null;
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refreshTasks: fetchTasks,
  };
} 