import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import WelcomeScreen from './components/WelcomeScreen';
import InputArea from './components/InputArea';
import ProgressBar from './components/ProgressBar';

const App = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResponseScreen, setIsResponseScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(null);
  const eventSourceRef = useRef(null);

  // Connect to SSE on mount
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/progress');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, []);

  const hitRequest = () => {
    if (message) {
      generateResponse(message);
    } else {
      alert("You must write something... !");
    }
  };

  const generateResponse = async (msg) => {
    setIsResponseScreen(true);
    setLoading(true);
    setMessage("");

    try {
      // Add the user message immediately
      setMessages(prev => [
        ...prev,
        { type: "userMsg", text: msg }
      ]);

      // Send request
      const response = await fetch("http://localhost:8000/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: msg,
          recursion_limit: 100
        }),
      });

      const data = await response.json();

      // Add the system/response message after the reply arrives
      setMessages(prev => [
        ...prev,
        {
          type: "responseMsg",
          text: data.output || JSON.stringify(data, null, 2),
          downloadReady: data.download_ready
        }
      ]);

    } catch (err) {
      console.error(err);
      alert("Error generating response");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch("http://localhost:8000/download");

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my_project.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error(err);
      alert("Error downloading project");
    }
  };

  const newChat = () => {
    setIsResponseScreen(false);
    setMessages([]);
    setProgress(null);
  };

  const handleCardClick = (text) => {
    generateResponse(text);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-gray-900 overflow-hidden">
      {isResponseScreen ? (
        <>
          <Header onNewChat={newChat} />
          <ProgressBar progress={progress} loading={loading} />
          <MessageList messages={messages} onDownload={handleDownload} />
        </>
      ) : (
        <WelcomeScreen onCardClick={handleCardClick} />
      )}

      <InputArea
        message={message}
        onChange={handleInputChange}
        onSubmit={hitRequest}
        loading={loading}
      />
    </div>
  );
};

export default App;