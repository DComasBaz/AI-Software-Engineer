import React from 'react';

const ProgressBar = ({ progress, loading, isDark }) => {
  if (!loading || !progress || progress.status === 'idle') return null;

  const pct = progress.total > 0 ? (progress.step / progress.total) * 100 : null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Progress: ${progress.message}`}
      className={`px-6 md:px-10 py-6 border-b transition-colors duration-300 ${isDark ? 'bg-[#0e0e0f] border-amber-500/10' : 'bg-[#f5f3ef] border-amber-400/20'}`}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <div className="relative flex-shrink-0" aria-hidden="true">
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <div className="absolute inset-0 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-60" />
        </div>

        <span className={`text-sm font-mono flex-1 truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {progress.message}
        </span>

        {pct !== null && (
          <div className="flex items-center gap-3 flex-shrink-0" aria-hidden="true">
            <span className={`text-sm font-mono ${isDark ? 'text-amber-400/70' : 'text-amber-600/80'}`}>
              {progress.step}/{progress.total}
            </span>
            <div className={`w-24 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`}>
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;