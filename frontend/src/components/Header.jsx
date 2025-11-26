import React from 'react';

const Header = ({ onNewChat }) => {
  return (
    <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b border-gray-300/50 backdrop-blur-sm bg-white/60">
      <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'>
        AiSoftwareEngineer
      </h2>
      <button
        className='bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 px-6 py-2.5 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg text-white'
        onClick={onNewChat}
      >
        New Chat
      </button>
    </div>
  );
};

export default Header;