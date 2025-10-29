import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className={`bg-seagreen-50 p-6 border-b border-seagreen-100 ${headerClassName}`}>
          <div className="flex items-center">
            {icon && <div className="mr-2">{icon}</div>}
            {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
          </div>
        </div>
      )}
      
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-gray-200 p-6">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;