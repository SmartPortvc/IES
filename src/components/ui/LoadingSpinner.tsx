import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  fullScreen = false,
  message = 'Loading...'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-4'
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-seagreen-500 border-b-seagreen-500 border-l-transparent border-r-transparent`}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex justify-center items-center z-50">
        <div className="flex flex-col items-center">
          {spinner}
          {message && <p className="mt-4 text-gray-700">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-6">
      <div className="flex flex-col items-center">
        {spinner}
        {message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;