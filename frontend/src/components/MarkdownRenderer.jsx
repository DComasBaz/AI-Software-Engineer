import React, { useState } from 'react';

/**
 * Lightweight markdown renderer — no extra dependencies.
 * Handles: headings, bold, italic, inline code, fenced code blocks, unordered/ordered lists.
 */

const CodeBlock = ({ code, lang, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`rounded-lg overflow-hidden my-3 border ${isDark ? 'border-white/8 bg-[#0b0b0c]' : 'border-zinc-200 bg-zinc-50'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-zinc-100'}`}>
        <span className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
            copied
              ? 'text-green-400'
              : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className={`px-4 py-3 text-xs overflow-x-auto leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

const parseInline = (text, isDark) => {
  // Process bold, italic, inline code in a string
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith('`')) {
      const code = token.slice(1, -1);
      parts.push(
        <code key={key++} className={`px-1.5 py-0.5 rounded text-[0.8em] font-mono ${isDark ? 'bg-white/8 text-amber-300' : 'bg-zinc-100 text-amber-700'}`}>
          {code}
        </code>
      );
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
};

const MarkdownRenderer = ({ content, isDark }) => {
  if (!content) return null;

  const elements = [];
  const lines = content.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={key++} code={codeLines.join('\n')} lang={lang} isDark={isDark} />);
      i++; // skip closing ```
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      elements.push(<h1 key={key++} className="text-lg font-bold mt-4 mb-1">{parseInline(h1[1], isDark)}</h1>);
      i++; continue;
    }
    if (h2) {
      elements.push(<h2 key={key++} className="text-base font-semibold mt-3 mb-1">{parseInline(h2[1], isDark)}</h2>);
      i++; continue;
    }
    if (h3) {
      elements.push(<h3 key={key++} className="text-sm font-semibold mt-2 mb-0.5">{parseInline(h3[1], isDark)}</h3>);
      i++; continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(
          <li key={i} className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
            <span>{parseInline(lines[i].replace(/^[-*] /, ''), isDark)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={key++} className="space-y-1 my-2">{listItems}</ul>);
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(
          <li key={i} className="flex items-start gap-2">
            <span className={`font-mono text-xs mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>{num++}.</span>
            <span>{parseInline(lines[i].replace(/^\d+\. /, ''), isDark)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ol key={key++} className="space-y-1 my-2">{listItems}</ol>);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={key++} className={`my-3 ${isDark ? 'border-white/10' : 'border-zinc-200'}`} />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="leading-relaxed">
        {parseInline(line, isDark)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
};

export default MarkdownRenderer;
