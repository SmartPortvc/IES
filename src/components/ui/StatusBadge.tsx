import React from 'react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusType | string;
  label: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const getStatusClasses = (): string => {
    switch (status) {
      case 'success':
      case 'registered':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'invited':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'info':
      case 'Coastal':
        return 'bg-teal-100 text-teal-800';
      case 'Foreign':
        return 'bg-indigo-100 text-indigo-800';
      case 'Loaded':
        return 'bg-green-100 text-green-800';
      case 'Unloaded':
        return 'bg-seagreen-100 text-seagreen-800';
      case 'Lighterage':
        return 'bg-yellow-100 text-yellow-800';
      case 'Transhipment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses()} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;