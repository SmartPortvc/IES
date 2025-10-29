import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../navigation/Sidebar';
import HodSidebar from '../navigation/HodSidebar';
import PortSidebar from '../navigation/PortSidebar';
import PageHeader from '../ui/PageHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backLink?: string;
  backLinkText?: string;
  activeItem?: string;
  setActiveItem?: (item: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  icon,
  backLink,
  backLinkText,
  activeItem = '',
  setActiveItem = () => {}
}) => {
  const { userRole } = useAuth();

  // Render the appropriate sidebar based on user role
  const renderSidebar = () => {
    switch (userRole) {
      case 'admin':
        return <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />;
      case 'hod':
        return <HodSidebar />;
      case 'port':
        return <PortSidebar />;
      default:
        return <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {renderSidebar()}
      
      <div className="flex-1 overflow-auto">
        <PageHeader 
          title={title} 
          subtitle={subtitle}
          backLink={backLink}
          backLinkText={backLinkText}
          icon={icon}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;