import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  message: string;
  redirectLink?: string;
  redirectText?: string;
  fullPage?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  redirectLink, 
  redirectText = 'Go Back', 
  fullPage = false 
}) => {
  const navigate = useNavigate();

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          {redirectLink && (
            <button
              onClick={() => navigate(redirectLink)}
              className="w-full bg-seagreen-600 hover:bg-seagreen-700 text-white font-medium py-2 px-4 rounded-md"
            >
              {redirectText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;