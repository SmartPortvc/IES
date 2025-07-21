import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  backLinkText?: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  backLink, 
  backLinkText = 'Back', 
  icon 
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {icon && <div className="mr-3">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
        
        {backLink && (
          <button
            onClick={() => navigate(backLink)}
            className="flex items-center text-seagreen-600 hover:text-seagreen-800"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            {backLinkText}
          </button>
        )}
      </div>
    </header>
  );
};

export default PageHeader;