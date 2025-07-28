import { useEffect, useState } from 'react';
import { Task, KanbanBoard } from '../types';
import { normalizeTask } from '../utils/normalize';

/**
 * Fetches tasks for ALL boards the user has access to and merges them into a single list.
 * This is purely client-side aggregation so we avoid adding backend endpoints.
 */
export function useAllBoardTasks(boards: KanbanBoard[], token: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || boards.length === 0) {
      setTasks([]);
      return;
    }

    let isCancelled = false;
    async function fetchAll() {
      setIsLoading(true);
      try {
        // Fire all requests in parallel.
        const promises = boards.map((b) =>
          fetch(`/api/boards/${b.id}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
        );
        const results = await Promise.all(promises);
        if (isCancelled) return;
        // Flatten, normalise, deduplicate by id just in case.
        const merged: Record<string, Task> = {};
        results.forEach((list, idx) => {
          const boardId = boards[idx].id;
          (Array.isArray(list) ? list : []).forEach((apiTask: any) => {
            const t = { ...normalizeTask(apiTask), boardId } as Task & { boardId: string };
            merged[t.id] = t;
          });
        });
        const final = Object.values(merged);
        setTasks(final);
        // Debug helpers
        if (typeof window !== 'undefined') {
          console.debug('[useAllBoardTasks] fetched tasks', {
            boards: boards.length,
            tasks: final.length,
          });
          // @ts-ignore
          if (typeof window !== 'undefined') window.__allTasks = final;
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => {
      isCancelled = true;
    };
  }, [boards, token]);

  return { tasks, isLoading };
}
