import React, { useEffect, useRef, useState } from 'react';
import { IoDownload } from 'react-icons/io5';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import MarkdownRenderer from './MarkdownRenderer';

const CopyButton = ({ text, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy response'}
      className={`flex items-center gap-1 text-[10px] font-mono mt-2 ml-1 px-2 py-1 rounded-md transition-all duration-200 ${
        copied
          ? 'text-green-400 bg-green-400/10'
          : isDark
            ? 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-black/5'
      }`}
    >
      {copied
        ? <><IoCheckmarkOutline className="text-xs" /> copied</>
        : <><IoCopyOutline className="text-xs" /> copy</>
      }
    </button>
  );
};

const MessageList = ({ messages, onDownload, isDark }) => {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 py-8 space-y-6"
    >
      {messages?.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.type === 'userMsg' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.type === 'userMsg' ? (
            <div className="max-w-[70%] md:max-w-[55%]">
              <div className="px-7 py-5 rounded-2xl rounded-tr-sm bg-amber-400 text-black font-medium text-sm leading-relaxed shadow-[0_4px_20px_rgba(251,191,36,0.15)]">
                {msg.text}
              </div>
              <p className={`text-[10px] font-mono mt-1 text-right pr-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                you
              </p>
            </div>
          ) : (
            <div className="max-w-[75%] md:max-w-[65%]">
              <p className={`text-[10px] font-mono mb-1 pl-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                ai_engineer
              </p>
              {msg.downloadReady ? (
                <button
                  onClick={() => onDownload(msg.sessionId)}
                  aria-label="Download project zip"
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-semibold text-lg group"
                >
                  <IoDownload className="text-2xl group-hover:animate-bounce" />
                  Download my_project.zip
                </button>
              ) : (
                <>
                  <div className={`px-5 py-4 rounded-2xl rounded-tl-sm ${isDark
                    ? 'bg-[#141415] border border-white/5 text-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    : 'bg-white border border-zinc-200 text-zinc-700 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                  }`}>
                    <MarkdownRenderer content={msg.text || "Loading ..."} isDark={isDark} />
                  </div>
                  <CopyButton text={msg.text} isDark={isDark} />
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;