import React from 'react';
import { IoSend } from 'react-icons/io5';
import { ImSpinner2 } from 'react-icons/im';

const InputArea = ({ message, onChange, onSubmit, loading, isDark }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message && message.trim()) onSubmit();
    }
  };

  const trimmed = message && message.trim();

  return (
    <div className={`px-6 md:px-10 py-5 border-t backdrop-blur-md transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#0e0e0f]/90' : 'border-zinc-200 bg-[#f5f3ef]/90'}`}>
      <div className="max-w-3xl mx-auto">
        <div className={`flex items-center border rounded-xl px-4 py-3 transition-all duration-200 ${isDark
          ? 'bg-[#141415] border-white/8 focus-within:border-amber-500/40 focus-within:shadow-[0_0_20px_rgba(251,191,36,0.04)]'
          : 'bg-white border-zinc-200 focus-within:border-amber-400/60 focus-within:shadow-[0_0_20px_rgba(251,191,36,0.08)] shadow-sm'
        }`}>
          <span className={`font-mono text-sm mr-3 flex-shrink-0 ${isDark ? 'text-amber-400/50' : 'text-amber-500/70'}`}>›</span>

          <textarea
            value={message}
            onChange={onChange}
            onKeyDown={handleKeyPress}
            rows={1}
            className={`flex-1 resize-none bg-transparent outline-none border-none font-mono text-sm caret-amber-400 scrollbar-hide ${isDark ? 'text-zinc-200 placeholder-zinc-600' : 'text-zinc-800 placeholder-zinc-400'}`}
            placeholder="describe what you want to build... (Shift+Enter for newline)"
          />

          <div className="ml-3 flex-shrink-0">
            {loading ? (
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isDark ? 'bg-amber-400/10' : 'bg-amber-100'}`}>
                <ImSpinner2 className="text-amber-500 text-base animate-spin" />
              </div>
            ) : (
              <div className="relative group">
                <button
                  onClick={onSubmit}
                  className={`ml-3 p-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${isDark
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-black text-white hover:bg-gray-700' }`}
                >
                  <IoSend className='text-lg' />
                </button>
                {trimmed && (
                  <span className="pointer-events-none absolute -inset-1 rounded-full blur-3xl opacity-20" style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.18), rgba(255,160,80,0.06))' }} />
                )}
              </div>
            )}
          </div>
        </div>

        <p className={`text-xs text-center font-mono mt-3 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>built by Daniel Comas</p>
      </div>
    </div>
  );
};

export default InputArea;