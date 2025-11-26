import React from 'react';
import { IoSend } from 'react-icons/io5';
import { ImSpinner2 } from 'react-icons/im';

const InputArea = ({ message, onChange, onSubmit, loading }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="px-6 md:px-12 lg:px-20 py-6 border-t border-gray-300/50 backdrop-blur-sm bg-white/60">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-full px-5 py-3 shadow-md focus-within:border-blue-300/70 transition-all">
          <input
            value={message}
            onChange={onChange}
            onKeyDown={handleKeyPress}
            type="text"
            className='flex-1 bg-transparent outline-none border-none text-gray-900 placeholder-gray-500'
            placeholder='Write your message here...'
          />
          {message && (
              loading ? (
                <ImSpinner2 className="text-black text-lg animate-spin mr-3" />
              ) : (
                <button
                    onClick={onSubmit}
                    className='ml-3 bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 p-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg'
                >
                    <IoSend className='text-white text-lg' />
                </button>
              )
          )}

        </div>
        <p className='text-gray-600 text-sm text-center mt-4'>
          AISoftwareEngineer was developed by Daniel Comas.
        </p>
      </div>
    </div>
  );
};

export default InputArea;