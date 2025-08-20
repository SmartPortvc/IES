import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Ship,
  LogOut,
  PlusCircle,
  Anchor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PortSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
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
        <Ship className="h-8 w-8" />
        {!collapsed && <h1 className="text-xl font-bold">Port Management</h1>}
      </div>

      <div className="flex-1 px-4 py-6">
        {!collapsed && (
          <p className="text-xs uppercase text-seagreen-300 font-semibold mb-4 px-2">
            Main Menu
          </p>
        )}

        <button
          onClick={() => navigate("/port-profile")}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            isActive("/port-profile")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Our Port Profile"
        >
          <Anchor className="h-5 w-5" />
          {!collapsed && <span>Our Port Profile</span>}
        </button>

        <button
          onClick={() => navigate("/add-vessel")}
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          } w-full px-4 py-3 rounded-lg mb-2 transition-colors ${
            isActive("/add-vessel")
              ? "bg-seagreen-700"
              : "hover:bg-seagreen-700/50"
          }`}
          title="Add Vessel"
        >
          <PlusCircle className="h-5 w-5" />
          {!collapsed && <span>ADD VESSEL</span>}
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

export default PortSidebar;
