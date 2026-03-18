import React, { useState } from 'react';
import { IoDownload, IoFolderOpen, IoCheckmarkCircle, IoCloseCircle, IoTime, IoTrash } from 'react-icons/io5';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

const statusIcon = (status) => {
  if (status === 'done')    return <IoCheckmarkCircle className="text-green-400 text-lg" />;
  if (status === 'error')   return <IoCloseCircle className="text-red-400 text-lg" />;
  return <IoTime className="text-amber-400 text-lg animate-pulse" />;
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const ProjectsView = ({ history, onDeleteSession, onSessionClick, isDark, onClose }) => {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (e, session) => {
    e.stopPropagation();
    setDownloading(session.id);
    try {
      const res = await fetch(`${BASE}/projects/${session.id}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading project');
    } finally {
      setDownloading(null);
    }
  };

  const done = history.filter(s => s.status === 'done');
  const other = history.filter(s => s.status !== 'done');

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-[#0e0e0f] text-gray-100' : 'bg-[#f5f3ef] text-gray-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-5 border-b ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <IoFolderOpen className="text-amber-400 text-2xl" />
          <h1 className="text-lg font-semibold tracking-tight">My Projects</h1>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-500'}`}>
            {done.length} completed
          </span>
        </div>
        <button
          onClick={onClose}
          className={`text-sm font-mono px-4 py-2 rounded-lg transition ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-black/5'}`}
        >
          ← back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <IoFolderOpen className="text-5xl" />
            <p className="text-sm font-mono">No projects yet</p>
          </div>
        ) : (
          <>
            {/* Completed projects */}
            {done.length > 0 && (
              <section className="mb-10">
                <h2 className={`text-xs font-mono uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Completed
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {done.map(session => (
                    <div
                      key={session.id}
                      onClick={() => { onSessionClick(session); onClose(); }}
                      className={`group relative flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isDark
                          ? 'bg-[#141415] border-white/5 hover:border-white/10 hover:bg-[#1a1a1b]'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug line-clamp-2 flex-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {session.prompt}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                          className={`opacity-0 group-hover:opacity-100 transition p-1 rounded-lg ${isDark ? 'text-zinc-600 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          <IoTrash className="text-sm" />
                        </button>
                      </div>

                      {/* Date */}
                      <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {formatDate(session.created_at)}
                      </p>

                      {/* Download button */}
                      <button
                        onClick={(e) => handleDownload(e, session)}
                        disabled={downloading === session.id}
                        className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-60"
                      >
                        <IoDownload className={downloading === session.id ? 'animate-bounce' : ''} />
                        {downloading === session.id ? 'Downloading...' : 'Download .zip'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other sessions (errors, pending) */}
            {other.length > 0 && (
              <section>
                <h2 className={`text-xs font-mono uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Other
                </h2>
                <div className="flex flex-col gap-2">
                  {other.map(session => (
                    <div
                      key={session.id}
                      onClick={() => { onSessionClick(session); onClose(); }}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                        isDark
                          ? 'bg-[#141415] border-white/5 hover:border-white/10'
                          : 'bg-white border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {statusIcon(session.status)}
                      <p className={`text-sm flex-1 truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {session.prompt}
                      </p>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {formatDate(session.created_at)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className={`opacity-0 group-hover:opacity-100 transition p-1 rounded-lg ${isDark ? 'text-zinc-600 hover:text-red-400' : 'text-zinc-400 hover:text-red-500'}`}
                      >
                        <IoTrash className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
