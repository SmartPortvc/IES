import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
  collapsed: boolean;
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  onClick,
  isActive,
  collapsed,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
        isActive ? 'bg-seagreen-700' : 'hover:bg-seagreen-700/50'
      } ${className}`}
      title={label}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
};

export default SidebarItem;