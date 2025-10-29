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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

        <button
          onClick={() => handleNavigation("/dashboard")}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            isPathActive("/dashboard")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5" />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() =>
            handleNavigation(isFullAdmin ? "/admin/vessels" : "/hod/vessels")
          }
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            location.pathname.includes("/vessels")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Vessels"
        >
          <Ship className="h-5 w-5" />
          {!collapsed && <span>Vessels</span>}
        </button>
        {/* <button
          onClick={() =>
            handleNavigation(isFullAdmin ? "/admin/weekly" : "/hod/weekly")
          }
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            location.pathname.includes("/weekly")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Weekly Performance"
        >
          <Ship className="h-5 w-5" />
          {!collapsed && <span>Weekly Performance</span>}
        </button> */}

        {isFullAdmin && (
          <button
            onClick={() => {
              setActiveItem("invite");
              navigate("/admin");
            }}
            className={`flex items-center ${
              collapsed ? "justify-center" : "space-x-3"
            } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeItem === "invite"
                ? "bg-seagreen-700"
                : "hover:bg-seagreen-700/50"
            }`}
            title="Invite Port"
          >
            <Mail className="h-5 w-5" />
            {!collapsed && <span>Invite Port</span>}
          </button>
        )}

        <button
          onClick={() => {
            setActiveItem("details");
            navigate("/admin");
          }}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            activeItem === "details"
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Port Details"
        >
          <FileText className="h-5 w-5" />
          {!collapsed && <span>Port Details</span>}
        </button>

        {isFullAdmin && (
          <button
            onClick={() => {
              setActiveItem("inviteHod");
              navigate("/admin");
            }}
            className={`flex items-center ${
              collapsed ? "justify-center" : "space-x-3"
            } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeItem === "inviteHod"
                ? "bg-seagreen-700"
                : "hover:bg-seagreen-700/50"
            }`}
            title="Invite HOD"
          >
            <UserPlus className="h-5 w-5" />
            {!collapsed && <span>Invite HOD</span>}
          </button>
        )}

        <button
          onClick={() => {
            setActiveItem("hodList");
            navigate("/admin");
          }}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            activeItem === "hodList"
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="HOD List"
        >
          <Users className="h-5 w-5" />
          {!collapsed && <span>HOD List</span>}
        </button>

        {isFullAdmin && (
          <button
            onClick={() => handleNavigation("/manage-cargo-types")}
            className={`flex items-center ${
              collapsed ? "justify-center" : "space-x-3"
            } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
              isPathActive("/manage-cargo-types")
                ? "bg-seagreen-700"
                : "hover:bg-seagreen-700/50"
            }`}
            title="Manage Cargo Types"
          >
            <Package className="h-5 w-5" />
            {!collapsed && <span>Manage Cargo Types</span>}
          </button>
        )}

        <button
          onClick={() => handleNavigation("/revenue")}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            isPathActive("/revenue")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Revenue Generated"
        >
          <DollarSign className="h-5 w-5" />
          {!collapsed && <span>Revenue Generated</span>}
        </button>

        <button
          onClick={() => handleNavigation("/cargo-handled")}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            isPathActive("/cargo-handled")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Cargo Handled Details"
        >
          <BarChart3 className="h-5 w-5" />
          {!collapsed && <span>Cargo Handled Details</span>}
        </button>
      </div>

      <div className="p-4 border-t border-seagreen-700">
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg text-seagreen-200 hover:bg-seagreen-700 transition-colors`}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
