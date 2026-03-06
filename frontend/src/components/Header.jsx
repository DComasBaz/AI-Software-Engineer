import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { HiSun, HiMoon } from 'react-icons/hi';

const Header = ({ onNewChat, onToggleSidebar, isDark, onToggleTheme }) => {
  return (
    <header className={`flex items-center justify-between px-10 md:px-20 py-4 border-b ${isDark ? 'border-amber-500/10 bg-[#0e0e0f]/90' : 'border-amber-400/20 bg-[#f5f3ef]/90'} backdrop-blur-md z-20 transition-colors duration-300`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle history sidebar"
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-zinc-400 hover:text-amber-400' : 'hover:bg-black/5 text-zinc-500 hover:text-amber-600'} transition-all duration-200`}
        >
          <FiMenu className="text-2xl" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]" aria-hidden="true" />
          <h1 className={`text-lg font-mono font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI<span className="text-amber-500">SoftwareEngineer</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-14">
        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${isDark ? 'bg-zinc-800 border border-white/10' : 'bg-amber-100 border border-amber-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isDark ? 'translate-x-0 bg-zinc-700' : 'translate-x-7 bg-white'}`}>
            {isDark
              ? <HiMoon className="text-amber-400 text-base" aria-hidden="true" />
              : <HiSun className="text-amber-500 text-base" aria-hidden="true" />
            }
          </span>
        </button>

        <button
          className={`px-5 py-2 rounded-full cursor-pointer text-base font-bold transition-all duration-300 shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-amber-400 ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
          onClick={onNewChat}
        >
          New Chat
        </button>
      </div>
    </header>
  );
};

export default Header;

