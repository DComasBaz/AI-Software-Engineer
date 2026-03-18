import { useEffect, useRef } from 'react';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

/**
 * Manages an SSE connection for session progress updates.
 * Cleans up properly on unmount and handles race conditions via a cancelled flag.
 */
export const useSSE = (sessionId, loading, { onProgress, onComplete, onError }) => {
  const eventSourceRef = useRef(null);

  // Keep callback refs up-to-date so the effect never captures stale closures.
  const callbacksRef = useRef({ onProgress, onComplete, onError });
  useEffect(() => {
    callbacksRef.current = { onProgress, onComplete, onError };
  });

  useEffect(() => {
    if (!sessionId || !loading) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    let cancelled = false;
    const es = new EventSource(`${BASE}/sessions/${sessionId}/progress`);

    es.onmessage = async (event) => {
      if (cancelled) return;

      const data = JSON.parse(event.data);
      callbacksRef.current.onProgress?.(data);

      if (data.status === 'complete') {
        es.close();
        try {
          const res = await fetch(`${BASE}/sessions/${sessionId}`);
          const session = await res.json();
          if (!cancelled) callbacksRef.current.onComplete(session);
        } catch (err) {
          if (!cancelled) callbacksRef.current.onError(err.message);
        }
      }

      if (data.status === 'error') {
        es.close();
        if (!cancelled) callbacksRef.current.onError(data.message);
      }
    };

    es.onerror = (err) => {
      console.error('SSE error:', err);
    };

    eventSourceRef.current = es;

    return () => {
      cancelled = true;
      es.close();
    };
  }, [sessionId, loading]);

  return eventSourceRef;
};
