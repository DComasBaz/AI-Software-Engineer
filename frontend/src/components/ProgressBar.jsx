import React from 'react';

const ProgressBar = ({ progress, loading }) => {
  if (!loading || !progress || progress.status === 'idle') {
    return null;
  }

  return (
    <div className="px-6 md:px-12 lg:px-20 py-3 bg-blue-50 border-b border-blue-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-blue-700">
            {progress.message}
          </span>
          {progress.total > 0 && (
            <span className="text-blue-600">
              {progress.step}/{progress.total}
            </span>
          )}
        </div>
        {progress.total > 0 && (
          <div className="mt-2 bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${(progress.step / progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;