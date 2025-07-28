import { useState, useEffect } from 'react';
import { Column } from '../types';

export function useColumns(boardId: string | null | undefined, token: string | null) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch columns from API
  const fetchColumns = async () => {
    if (!boardId || !token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setColumns(data as Column[]);
        // If no columns exist for this board yet, create the default three columns
        if ((data as Column[]).length === 0) {
          const defaultTitles = ['To Do', 'Doing', 'Done'];
          for (const title of defaultTitles) {
            await createColumn(title);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new column
  const createColumn = async (title: string) => {
    if (!boardId || !token) return null;
    const status = title.toLowerCase().replace(/\s+/g, '-');
    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, status }),
      });
      if (response.ok) {
        const newCol: Column = await response.json();
        setColumns((prev) => [...prev, newCol]);
        return newCol;
      }
    } catch (error) {
      console.error('Failed to create column:', error);
    }
    return null;
  };

  useEffect(() => {
    fetchColumns();
  }, [boardId, token]);

  return { columns, isLoading, createColumn, refreshColumns: fetchColumns };
}
