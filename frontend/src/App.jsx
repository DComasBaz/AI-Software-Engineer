import React, { useState } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import WelcomeScreen from './components/WelcomeScreen';
import InputArea from './components/InputArea';

const App = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResponseScreen, setIsResponseScreen] = useState(false);
  const [messages, setMessages] = useState([]);

  const hitRequest = () => {
    if (message) {
      generateResponse(message);
      setLoading(true)
    } else {
      alert("You must write something... !");
    }
  };

  const generateResponse = async (msg) => {
    try {
      const response = await fetch("http://localhost:8000/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: msg,
          recursion_limit: 100
        }),
      });

      const data = await response.json();

      const newMessages = [
        ...messages,
        { type: "userMsg", text: msg },
        { type: "responseMsg", text: data.output || JSON.stringify(data, null, 2), downloadReady: data.download_ready },
      ];

      setMessages(newMessages);
      setIsResponseScreen(true);
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Error generating response");
    } finally {
    setLoading(false);        // hide spinner
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
  };

  const handleCardClick = (text) => {
    setMessage(text);
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

