import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBars,
  faSignOutAlt,
  faChartLine,
  faCubes,
  faCashRegister,
  faUsersGear,
  faListAlt,
} from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../context/AuthContext";

type Tab = {
  id: number;
  icon: React.ReactNode;
  text: string;
  path: string;
  allowedRoles: string[];
  onClick?: () => void; // Add onClick handler
};

const Layout: React.FC = () => {
  const { role, setRole, setUsername } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { username } = useAuth();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    setRole(null);
    setUsername(null);
    navigate("/login");
  };

  const allTabs: Tab[] = [
    {
      id: 1,
      icon: <FontAwesomeIcon icon={faChartLine} />,
      text: "Dashboard",
      path: "/dashboard",
      allowedRoles: ["admin", "manager"],
    },
    {
      id: 2,
      icon: <FontAwesomeIcon icon={faCubes} />,
      text: "Products",
      path: "/products",
      allowedRoles: ["admin", "manager"],
    },
    {
      id: 3,
      icon: <FontAwesomeIcon icon={faCashRegister} />,
      text: "POS",
      path: "/pos",
      allowedRoles: ["staff", "admin", "manager"],
    },
    {
      id: 4,
      icon: <FontAwesomeIcon icon={faUsersGear} />,
      text: "User Management",
      path: "/users",
      allowedRoles: ["admin"],
    },
    {
      id: 5,
      icon: <FontAwesomeIcon icon={faListAlt} />,
      text: "Sales History",
      path: "/sales",
      allowedRoles: ["admin", "manager", "staff"],
    },
    {
      id: 6, // Add logout tab
      icon: <FontAwesomeIcon icon={faSignOutAlt} />,
      text: "Logout",
      path: "/",
      allowedRoles: ["admin", "manager", "staff"],
      onClick: handleLogout,
    },
  ];

  const filteredTabs = role
    ? allTabs.filter((tab) => tab.allowedRoles.includes(role))
    : [];

  // Find active tab or default to dashboard
  const activeTab =
    filteredTabs.find((tab) => currentPath.includes(tab.path)) ||
    filteredTabs.find((tab) => tab.path === "/pos") ||
    filteredTabs[0];

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentPath]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Toaster richColors position="bottom-right" />

      {/* Sidebar - Hidden on small screens */}
      <div
        className={`fixed inset-y-0 left-0 bg-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col w-64 overflow-y-auto md:overflow-visible ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 ${isSidebarCollapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="px-3 rounded-lg border border-gray-600 hover:bg-gray-300 transition-all duration-200 focus:outline-none hidden md:block"
          >
            {isSidebarCollapsed ? (
              <FontAwesomeIcon icon={faArrowRight} />
            ) : (
              <FontAwesomeIcon icon={faArrowLeft} />
            )}
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden px-3 rounded-lg border border-gray-600 hover:bg-gray-300 transition-all duration-200 focus:outline-none"
          >
            Close
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {filteredTabs
            .filter((tab) => tab.path !== "/")
            .map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center p-4 ${
                  currentPath.includes(tab.path)
                    ? "bg-blue-900 text-white hover:text-white"
                    : "hover:bg-gray-300 hover:text-blue-800 text-blue-900 transition-all duration-200"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {!isSidebarCollapsed && <span className="ml-2">{tab.text}</span>}
              </Link>
            ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-300">
          {filteredTabs
            .filter((tab) => tab.path === "/")
            .map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`flex items-center w-full p-4 rounded-lg hover:bg-gray-300 transition-all duration-200 ${
                  isSidebarCollapsed ? "justify-center" : ""
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {!isSidebarCollapsed && <span className="ml-2">{tab.text}</span>}
              </button>
            ))}
        </div>
      </div>

      {/* Main Content Area with Navbar */}
      <div className="flex-1 flex flex-col overflow-y-auto z-40">
        {/* Top Navbar */}
        <div className="bg-gray-200 shadow-sm px-4 sm:px-6 py-1 flex justify-between items-center border-b">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden px-3 rounded-lg border border-gray-600 hover:bg-gray-300 transition-all duration-200 focus:outline-none"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="flex items-center space-x-4">
            {/* User Profile */}
            {username && (
              <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white flex items-center justify-center rounded-full text-lg font-semibold uppercase">
                  {username[0]}
                </div>
                <span className="hidden md:inline-block font-semibold">{username}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Page Content */}
        <div className="p-4 sm:p-8 overflow-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">{activeTab.text}</h1>
          <div className="overflow-x-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;