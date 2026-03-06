import { useState, useCallback, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

/**
 * Manages session history: fetching and deleting.
 * Fetches automatically on mount.
 */
export const useHistory = () => {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${BASE}/sessions`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id) => {
    try {
      await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, historyLoading, fetchHistory, deleteSession };
};
