import React from 'react';

const PromptCard = ({ text, onClick, icon: Icon, iconColor, bgColor, hoverBgColor, hoverBorderColor }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 backdrop-blur-sm border border-gray-300/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${hoverBorderColor} min-h-[180px] flex flex-col justify-between`}
    >
      <p className='text-xl font-medium text-white leading-relaxed whitespace-pre-line'>
        {text}
      </p>
      <div className='flex justify-end'>
        <div className={`${bgColor} p-3 rounded-full ${hoverBgColor} transition-all`}>
          <Icon className={`text-2xl ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default PromptCard;