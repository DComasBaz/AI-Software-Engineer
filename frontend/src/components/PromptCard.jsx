import React from 'react';

const PromptCard = ({ text, onClick, icon: Icon, tag, isDark }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Run prompt: ${text}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`group relative border rounded-xl px-10 py-6 cursor-pointer transition-all duration-300 overflow-hidden
        ${isDark
          ? 'bg-[#141415] border-white/5 hover:border-amber-500/30 hover:bg-[#1a1a1b]'
          : 'bg-white border-zinc-200 hover:border-amber-400/60 hover:bg-amber-50/30 shadow-sm hover:shadow-md'
        }`}
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        aria-hidden="true"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at top left, rgba(251,191,36,0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top left, rgba(251,191,36,0.08) 0%, transparent 70%)',
        }}
      />

      <span className={`text-[13px] font-mono tracking-widest uppercase mb-3 block ${isDark ? 'text-amber-400/50' : 'text-amber-600/60'}`}>
        /{tag}
      </span>

      <p className={`text-base leading-relaxed mb-6 transition-colors duration-200 ${isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-600 group-hover:text-zinc-900'}`}>
        {text}
      </p>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono transition-colors ${isDark ? 'text-zinc-600 group-hover:text-zinc-500' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
          click to run →
        </span>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${isDark ? 'bg-amber-400/10 group-hover:bg-amber-400/20' : 'bg-amber-100 group-hover:bg-amber-200'}`} aria-hidden="true">
          <Icon className="text-amber-500 text-base" />
        </div>
      </div>
    </div>
  );
};

export default PromptCard;