import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Ship,
  Users,
  LogOut,
  Mail,
  FileText,
  UserPlus,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LayoutDashboard,
  Anchor,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SidebarItem from "./SidebarItem";

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Check if user is full admin or HOD (view-only)
  const isFullAdmin = userRole === "admin";
  const isHod = userRole === "hod";

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Helper function to check if a path is active
  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  // Helper function to handle navigation with proper active item setting
  const handleNavigation = (path: string, itemKey?: string) => {
    navigate(path);
    if (itemKey) {
      setActiveItem(itemKey);
    }
  };

  return (
    <div
      className={`bg-seagreen-800 text-white h-screen ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col relative transition-all duration-300`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-seagreen-700 rounded-full p-1 text-white z-10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div
        className={`p-6 flex items-center ${
          collapsed ? "justify-center" : "space-x-3"
        }`}
      >
        <img
          src="https://apmaritime.in/assets/apmb-B0Lm-J0A.png"
          alt="APMB Logo"
          className={`${
            collapsed ? "h-10 w-10" : "h-12 w-12"
          } object-contain rounded-lg`}
        />
        {!collapsed && <h1 className="text-xl font-bold">IES</h1>}
      </div>

      <div className="flex-1 px-4 py-6">
        {!collapsed && (
          <p className="text-xs uppercase text-seagreen-300 font-semibold mb-4 px-2">
            Main Menu
          </p>
        )}

        <SidebarItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          onClick={() => handleNavigation("/dashboard")}
          isActive={isPathActive("/dashboard")}
          collapsed={collapsed}
        />

        <SidebarItem
          icon={<Ship className="h-5 w-5" />}
          label="Vessels"
          onClick={() =>
            handleNavigation(isFullAdmin ? "/admin/vessels" : "/hod/vessels")
          }
          isActive={location.pathname.includes("/vessels")}
          collapsed={collapsed}
        />

        {/* <SidebarItem
          icon={<Ship className="h-5 w-5" />}
          label="Weekly Performance"
          onClick={() =>
            handleNavigation(isFullAdmin ? "/admin/weekly" : "/hod/weekly")
          }
          isActive={location.pathname.includes("/weekly")}
          collapsed={collapsed}
        /> */}

        {isFullAdmin && (
          <SidebarItem
            icon={<Mail className="h-5 w-5" />}
            label="Invite Port"
            onClick={() => {
              setActiveItem("invite");
              navigate("/admin");
            }}
            isActive={activeItem === "invite"}
            collapsed={collapsed}
          />
        )}

        <SidebarItem
          icon={<FileText className="h-5 w-5" />}
          label="Port Details"
          onClick={() => {
            setActiveItem("details");
            navigate("/admin");
          }}
          isActive={activeItem === "details"}
          collapsed={collapsed}
        />

        {isFullAdmin && (
          <SidebarItem
            icon={<UserPlus className="h-5 w-5" />}
            label="Invite HOD"
            onClick={() => {
              setActiveItem("inviteHod");
              navigate("/admin");
            }}
            isActive={activeItem === "inviteHod"}
            collapsed={collapsed}
          />
        )}

        <SidebarItem
          icon={<Users className="h-5 w-5" />}
          label="HOD List"
          onClick={() => {
            setActiveItem("hodList");
            navigate("/admin");
          }}
          isActive={activeItem === "hodList"}
          collapsed={collapsed}
        />

        {isFullAdmin && (
          <SidebarItem
            icon={<Package className="h-5 w-5" />}
            label="Manage Cargo Types"
            onClick={() => handleNavigation("/manage-cargo-types")}
            isActive={isPathActive("/manage-cargo-types")}
            collapsed={collapsed}
          />
        )}

        <SidebarItem
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue Generated"
          onClick={() => handleNavigation("/revenue")}
          isActive={isPathActive("/revenue")}
          collapsed={collapsed}
        />

        <SidebarItem
          icon={<BarChart3 className="h-5 w-5" />}
          label="Cargo Handled Details"
          onClick={() => handleNavigation("/cargo-handled")}
          isActive={isPathActive("/cargo-handled")}
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

export default Sidebar;
