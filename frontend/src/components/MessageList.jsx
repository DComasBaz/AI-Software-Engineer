import React from 'react';
import { IoDownload } from 'react-icons/io5';

const MessageList = ({ messages, onDownload }) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 py-8 space-y-4">
      {messages?.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.type === 'userMsg' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.type === 'userMsg' ? (
            <div className="max-w-[70%] md:max-w-[60%] px-6 py-4 rounded-2xl shadow-md bg-gradient-to-r from-blue-400 to-purple-400 text-white">
              {msg.text}
            </div>
          ) : (
            <div className="max-w-[70%] md:max-w-[60%]">
              {msg.downloadReady ? (
                <button
                  onClick={onDownload}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-semibold text-lg group"
                >
                  <IoDownload className='text-2xl group-hover:animate-bounce' />
                  Download my_project.zip
                </button>
              ) : (
                <div className="px-6 py-4 rounded-2xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-300/50 text-gray-900">
                  <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;