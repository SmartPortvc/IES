import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, LogOut, DollarSign, ChevronLeft, ChevronRight, BarChart3, LayoutDashboard, Ship } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SidebarItem from './SidebarItem';

const HodSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`bg-seagreen-800 text-white h-screen ${collapsed ? 'w-20' : 'w-64'} flex flex-col relative transition-all duration-300`}>
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-seagreen-700 rounded-full p-1 text-white z-10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
        <img 
          src="https://apmaritime.in/images/13_apmb_logo.png"
          alt="APMB Logo"
          className={`${collapsed ? 'h-10 w-10' : 'h-12 w-12'} object-contain rounded-lg`}
        />
        {!collapsed && <h1 className="text-xl font-bold">IES</h1>}
      </div>
      
      <div className="flex-1 px-4 py-6">
        {!collapsed && <p className="text-xs uppercase text-seagreen-300 font-semibold mb-4 px-2">Main Menu</p>}
        
        <SidebarItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          onClick={() => navigate('/dashboard')}
          isActive={isActive('/dashboard')}
          collapsed={collapsed}
        />

        <SidebarItem
          icon={<Ship className="h-5 w-5" />}
          label="Vessels"
          onClick={() => navigate('/hod/vessels')}
          isActive={location.pathname.includes('/vessels')}
          collapsed={collapsed}
        />
        
        <SidebarItem
          icon={<FileText className="h-5 w-5" />}
          label="Port Details"
          onClick={() => navigate('/hod-dashboard')}
          isActive={isActive('/hod-dashboard')}
          collapsed={collapsed}
        />

        <SidebarItem
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue Generated"
          onClick={() => navigate('/revenue')}
          isActive={isActive('/revenue')}
          collapsed={collapsed}
        />

        <SidebarItem
          icon={<BarChart3 className="h-5 w-5" />}
          label="Cargo Handled"
          onClick={() => navigate('/cargo-handled')}
          isActive={isActive('/cargo-handled')}
          collapsed={collapsed}
        />
      </div>
      
      <div className="p-4 border-t border-seagreen-700">
        <SidebarItem
          icon={<LogOut className="h-5 w-5" />}
          label="Logout"
          onClick={handleLogout}
          isActive={false}
          collapsed={collapsed}
          className="text-seagreen-200 hover:bg-seagreen-700"
        />
      </div>
    </div>
  );
};

export default HodSidebar;