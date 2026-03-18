import React from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { FiX } from 'react-icons/fi';

const SkeletonItem = ({ isDark }) => (
  <div className={`flex items-start gap-3 px-4 py-3.5 border-b ${isDark ? 'border-white/3' : 'border-zinc-200/60'}`}>
    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} animate-pulse`} />
    <div className="flex-1 space-y-2">
      <div className={`h-2.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} animate-pulse w-3/4`} />
      <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-800/60' : 'bg-zinc-200/60'} animate-pulse w-1/2`} />
    </div>
  </div>
);

const HistorySidebar = ({ open, history, historyLoading, onSessionClick, onDeleteSession, onClose, isDark }) => {
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusConfig = {
    done:    { dot: 'bg-emerald-400', label: isDark ? 'text-emerald-400/70' : 'text-emerald-600/80' },
    error:   { dot: 'bg-red-400',     label: isDark ? 'text-red-400/70'     : 'text-red-500/80' },
    pending: { dot: 'bg-yellow-400',  label: isDark ? 'text-yellow-400/70'  : 'text-yellow-600/80' },
    running: { dot: 'bg-amber-400',   label: isDark ? 'text-amber-400/70'   : 'text-amber-600/80' },
  };

  return (
    <>
      {/* Mobile backdrop — tap to close */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sidebar panel */}
      <aside
        role="complementary"
        aria-label="Session history"
        className={`
          fixed md:static inset-y-0 left-0 z-30 md:z-10
          w-72 h-screen flex flex-col border-r shrink-0 overflow-hidden
          transform transition-transform duration-300
          md:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${!open ? 'md:hidden' : ''}
          ${isDark ? 'bg-[#0b0b0c] border-white/5' : 'bg-[#eeece8] border-zinc-200'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <h3 className={`font-mono text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
              history
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history sidebar"
            className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300' : 'hover:bg-black/5 text-zinc-400 hover:text-zinc-700'}`}
          >
            <FiX className="text-base" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-none" style={{scrollbarWidth:"none",msOverflowStyle:"none"}}>
          {historyLoading ? (
            // Skeleton state
            Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} isDark={isDark} />)
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-12 px-6 gap-2">
              <p className={`text-xs font-mono text-center ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
                no sessions yet.
              </p>
              <p className={`text-xs font-mono text-center ${isDark ? 'text-zinc-800' : 'text-zinc-400'}`}>
                start building something →
              </p>
            </div>
          ) : (
            history.map((session) => {
              const cfg = statusConfig[session.status] || statusConfig.pending;
              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Load session: ${session.prompt}`}
                  onKeyDown={(e) => e.key === 'Enter' && onSessionClick(session)}
                  className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all border-b ${isDark
                    ? 'hover:bg-white/3 border-white/3'
                    : 'hover:bg-white/60 border-zinc-200/60'
                  }`}
                  onClick={() => onSessionClick(session)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate transition-colors font-mono leading-snug ${isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-600 group-hover:text-zinc-900'}`}>
                      {session.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${cfg.label}`}>
                        {session.status}
                      </span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    aria-label="Delete session"
                    className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0 mt-0.5 ${isDark
                      ? 'hover:bg-red-500/10 text-zinc-600 hover:text-red-400'
                      : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                    }`}
                  >
                    <IoTrashOutline className="text-sm" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;