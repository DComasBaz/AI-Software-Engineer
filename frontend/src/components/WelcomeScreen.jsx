import React from 'react';
import PromptCard from './PromptCard';
import { FaCalculator } from "react-icons/fa6";
import { FaList } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";

const WelcomeScreen = ({ onCardClick }) => {
  const prompts = [
    {
      text: "Create a calculator app using html, css and javascript.",
      onClick: () => onCardClick("Create a calculator app using html, css and javascript."),
      icon: FaCalculator,
      iconColor: 'text-black-500',
      bgColor: 'bg-white',
      hoverBgColor: 'group-hover:bg-blue-300/50',
      hoverBorderColor: 'hover:border-blue-300/70'
    },
    {
      text: "Create a to do list app using html, css and javascript.",
      onClick: () => onCardClick("Create a to do list app using html, css and javascript."),
      icon: FaList,
      iconColor: 'text-black-500',
      bgColor: 'bg-white',
      hoverBgColor: 'group-hover:bg-purple-300/50',
      hoverBorderColor: 'hover:border-purple-300/70'
    },
    {
      text: "Create a calendar app using html, css and javascript.",
      onClick: () => onCardClick("Create a calendar app using html, css and javascript."),
      icon: FaCalendarAlt,
      iconColor: 'text-black-500',
      bgColor: 'bg-white',
      hoverBgColor: 'group-hover:bg-green-300/50',
      hoverBorderColor: 'hover:border-green-300/70'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <h1 className='text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent py-2'>
        AISoftwareEngineer
      </h1>
      <p className='text-gray-600 mt-2 mb-12 text-lg'>How can I help you today?</p>

      <div className="mx-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-5xl">
        {prompts.map((prompt, index) => (
          <PromptCard key={index} {...prompt} />
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;