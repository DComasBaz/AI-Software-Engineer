import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import WelcomeScreen from './components/WelcomeScreen';
import InputArea from './components/InputArea';
import ProgressBar from './components/ProgressBar';
import HistorySidebar from './components/HistorySidebar';
import { useSSE } from './hooks/useSSE';
import { useHistory } from './hooks/useHistory';
import ProjectsView from './components/ProjectsView';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

const App = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResponseScreen, setIsResponseScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [projectSessionId, setProjectSessionId] = useState(null);
  const [theme, setTheme] = useState('light');
  const [backendOnline, setBackendOnline] = useState(null);
  const [showProjects, setShowProjects] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isDark = theme === 'dark';

  const { history, historyLoading, fetchHistory, deleteSession } = useHistory();

  // Check backend connectivity once on mount
  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${BASE}/sessions`, { signal: controller.signal });
        clearTimeout(timeout);
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
  }, []);

  // Close SSE on unmount to prevent leaking connections
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  const saveMessages = useCallback(async (sid, msgs) => {
    const targetId = projectSessionId || sid;
    try {
      await fetch(`${BASE}/sessions/${targetId}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  }, [projectSessionId]);

  // SSE hook — handles progress and completion
  const eventSourceRef = useSSE(sessionId, loading, {
    onProgress: setProgress,
    onComplete: (session) => {
      const newMsg = {
        type: 'responseMsg',
        text: '',
        downloadReady: session.download_ready,
        sessionId: session.id,
      };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        saveMessages(session.id, updated);
        return updated;
      });
      setLoading(false);
      setCancelling(false);
      fetchHistory();
    },
    onError: (errMsg) => {
      const newMsg = { type: 'responseMsg', text: `Error: ${errMsg}`, downloadReady: false, sessionId: sessionId };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        saveMessages(sessionId, updated);
        return updated;
      });
      setLoading(false);
      setCancelling(false);
      fetchHistory();
    },
  });

  // ---------------------------------------------------------------------------
  // Cancel an in-progress generation
  // ---------------------------------------------------------------------------
  const handleCancel = useCallback(async () => {
    if (!sessionId || cancelling) return;
    setCancelling(true);

    // Close the SSE stream immediately on the frontend
    eventSourceRef.current?.close();

    try {
      await fetch(`${BASE}/projects/${sessionId}/cancel`, { method: 'POST' });
    } catch (err) {
      console.error('Cancel request failed:', err);
    }

    // Optimistically update the UI — the SSE onError/onComplete will also fire
    // once the backend confirms, but we don't want to leave the user waiting.
    const cancelMsg = { type: 'responseMsg', text: 'Generation cancelled.', downloadReady: false };
    setMessages(prev => {
      const updated = [...prev, cancelMsg];
      saveMessages(sessionId, updated);
      return updated;
    });
    setLoading(false);
    setCancelling(false);
    fetchHistory();
  }, [sessionId, cancelling, saveMessages, fetchHistory]);

  // ---------------------------------------------------------------------------
  // Generate / modify
  // ---------------------------------------------------------------------------
  const generateResponse = useCallback(async (msg) => {
    setIsResponseScreen(true);
    setLoading(true);
    setMessage('');
    setProgress(null);
    setCancelling(false);

    const userMsg = { type: 'userMsg', text: msg };

    // Use functional setter to avoid stale closure on rapid sends
    setMessages(prev => {
      const updated = [...prev, userMsg];
      return updated;
    });

    try {
      const body = { prompt: msg };
      if (projectSessionId) body.existing_session_id = projectSessionId;

      const response = await fetch(`${BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        const detail = err.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map(e => e.msg ?? JSON.stringify(e)).join(', ')
            : JSON.stringify(detail) || 'Request failed';
        throw new Error(msg);
      }

      const data = await response.json();

      setMessages(prev => {
        saveMessages(data.session_id, prev);
        return prev;
      });

      setSessionId(data.session_id);
      if (!projectSessionId) setProjectSessionId(data.session_id);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { type: 'responseMsg', text: `Error: ${err.message}`, downloadReady: false },
      ]);
      setLoading(false);
    }
  }, [projectSessionId, saveMessages, fetchHistory]);

  const hitRequest = () => {
    if (message.trim()) {
      generateResponse(message);
    } else {
      alert('You must write something...');
    }
  };

  const handleDownload = async (sid) => {
    const target = sid || sessionId;
    if (!target) return alert('No project session found.');
    try {
      const response = await fetch(`${BASE}/projects/${target}/download`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Error downloading project');
    }
  };

  const handleHistoryClick = (session) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setSessionId(session.id);
    setProjectSessionId(session.id);
    setIsResponseScreen(true);
    setSidebarOpen(false);
    setProgress(null);
    setCancelling(false);

    const buildMessages = (parsed) => {
      const errorText = session.status === 'error' ? `Error: ${session.output}` : '';
      const finalMsg = { type: 'responseMsg', text: errorText, downloadReady: session.download_ready };

      if (parsed.length === 0 || parsed[parsed.length - 1].type === 'userMsg') {
        return [...parsed, finalMsg];
      }

      const result = [...parsed];
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].type === 'responseMsg') {
          result[i] = finalMsg;
          break;
        }
      }
      return result;
    };

    if (session.messages_json) {
      try {
        const parsed = JSON.parse(session.messages_json);
        setMessages(buildMessages(parsed));
      } catch {
        setMessages(buildMessages([{ type: 'userMsg', text: session.prompt }]));
      }
    } else {
      setMessages(buildMessages([{ type: 'userMsg', text: session.prompt }]));
    }

    setLoading(session.status === 'pending' || session.status === 'running');
  };

  const newChat = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsResponseScreen(false);
    setMessages([]);
    setProgress(null);
    setSessionId(null);
    setProjectSessionId(null);
    setLoading(false);
    setCancelling(false);
  };

  return (
    <>
    {showProjects && (
      <ProjectsView
        history={history}
        onDeleteSession={deleteSession}
        onSessionClick={handleHistoryClick}
        isDark={isDark}
        onClose={() => setShowProjects(false)}
      />
    )}
    <div className={`flex min-h-screen w-screen ${isDark ? 'bg-[#0e0e0f] text-gray-100' : 'bg-[#f5f3ef] text-gray-900'} transition-colors duration-300`}>
      <HistorySidebar
        open={sidebarOpen}
        history={history}
        historyLoading={historyLoading}
        onSessionClick={handleHistoryClick}
        onDeleteSession={deleteSession}
        onClose={() => setSidebarOpen(false)}
        isDark={isDark}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onNewChat={newChat}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          isDark={isDark}
          onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          onShowProjects={() => setShowProjects(true)}
        />

        {/* Offline banner */}
        {backendOnline === false && (
          <div className="px-6 py-2.5 bg-red-500/10 border-b border-red-500/20 text-center">
            <p className="text-xs font-mono text-red-400">
              ⚠ Backend not connected — make sure the server is running on{' '}
              <code className="text-red-300">{BASE}</code>
            </p>
          </div>
        )}

        {isResponseScreen ? (
          <>
            <ProgressBar progress={progress} loading={loading} isDark={isDark} />

            {/* Stop button — only visible while running */}
            {loading && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono border transition-all duration-200 ${
                    isDark
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40'
                      : 'border-red-400/40 text-red-500 hover:bg-red-50 disabled:opacity-40'
                  }`}
                >
                  {/* Simple inline square-stop icon — no extra dependency */}
                  <span className="w-2.5 h-2.5 rounded-sm bg-current inline-block" />
                  {cancelling ? 'stopping...' : 'stop generation'}
                </button>
              </div>
            )}

            <MessageList messages={messages} onDownload={handleDownload} isDark={isDark} />
          </>
        ) : (
          <WelcomeScreen onCardClick={generateResponse} isDark={isDark} />
        )}

        <InputArea
          message={message}
          onChange={(e) => setMessage(e.target.value)}
          onSubmit={hitRequest}
          loading={loading}
          isDark={isDark}
        />
      </div>
    </div>
    </>
  );
};

export default App;