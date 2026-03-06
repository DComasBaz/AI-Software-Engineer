import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import WelcomeScreen from './components/WelcomeScreen';
import InputArea from './components/InputArea';
import ProgressBar from './components/ProgressBar';
import HistorySidebar from './components/HistorySidebar';
import { useSSE } from './hooks/useSSE';
import { useHistory } from './hooks/useHistory';

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
  const [theme, setTheme] = useState('dark');
  const [backendOnline, setBackendOnline] = useState(null); // null=checking, true/false

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

  const saveMessages = useCallback(async (sid, msgs) => {
    try {
      await fetch(`${BASE}/sessions/${sid}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  }, []);

  // SSE hook — handles progress and completion
  const eventSourceRef = useSSE(sessionId, loading, {
    onProgress: setProgress,
    onComplete: (session) => {
      const newMsg = {
        type: 'responseMsg',
        text: session.output || 'Project generated successfully.',
        downloadReady: session.download_ready,
      };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        saveMessages(sessionId, updated);
        return updated;
      });
      setLoading(false);
      fetchHistory();
    },
    onError: (errMsg) => {
      const newMsg = { type: 'responseMsg', text: `Error: ${errMsg}`, downloadReady: false };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        saveMessages(sessionId, updated);
        return updated;
      });
      setLoading(false);
      fetchHistory();
    },
  });

  const generateResponse = useCallback(async (msg) => {
    setIsResponseScreen(true);
    setLoading(true);
    setMessage('');
    setProgress(null);

    // Build the updated messages list upfront to avoid stale closure
    const userMsg = { type: 'userMsg', text: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

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
        throw new Error(err.detail || 'Request failed');
      }

      const data = await response.json();

      // Save the current message list
      saveMessages(data.session_id, updatedMessages);
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
  }, [messages, projectSessionId, saveMessages, fetchHistory]);

  const hitRequest = () => {
    if (message.trim()) {
      generateResponse(message);
    } else {
      alert('You must write something...');
    }
  };

  const handleDownload = async () => {
    if (!sessionId) return alert('No project session found.');
    try {
      const response = await fetch(`${BASE}/projects/${sessionId}/download`);
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

    if (session.messages_json) {
      try {
        setMessages(JSON.parse(session.messages_json));
      } catch {
        setMessages([
          { type: 'userMsg', text: session.prompt },
          { type: 'responseMsg', text: session.output || 'No output recorded.', downloadReady: session.download_ready },
        ]);
      }
    } else {
      setMessages([
        { type: 'userMsg', text: session.prompt },
        { type: 'responseMsg', text: session.output || 'No output recorded.', downloadReady: session.download_ready },
      ]);
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
  };

  return (
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
  );
};

export default App;