import React from 'react';
import PromptCard from './PromptCard';
import { FaCalculator } from 'react-icons/fa6';
import { FaList, FaCalendarAlt } from 'react-icons/fa';

const prompts = [
  {
    text: 'Create a calculator app using html, css and javascript.',
    icon: FaCalculator,
    tag: 'utility',
  },
  {
    text: 'Create a to do list app using html, css and javascript.',
    icon: FaList,
    tag: 'productivity',
  },
  {
    text: 'Create a calendar app using html, css and javascript.',
    icon: FaCalendarAlt,
    tag: 'scheduling',
  },
];

const WelcomeScreen = ({ onCardClick, isDark }) => {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="mb-12 text-center">
        <p className={`text-xs font-mono tracking-[0.3em] uppercase mb-3 ${isDark ? 'text-amber-400/60' : 'text-amber-600/70'}`}>
          AI Software Engineer v1.0
        </p>
        <h1 className={`text-5xl md:text-6xl font-display font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Build anything.
        </h1>
        <h2 className="text-5xl md:text-6xl font-display font-black text-amber-400 leading-none tracking-tight mt-1">
          Instantly.
        </h2>
        <p className={`mt-4 text-base ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Describe your project and watch it come to life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-7xl">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.tag}
            text={prompt.text}
            icon={prompt.icon}
            tag={prompt.tag}
            onClick={() => onCardClick(prompt.text)}
            isDark={isDark}
          />
        ))}
      </div>
    </main>
  );
};

export default WelcomeScreen;