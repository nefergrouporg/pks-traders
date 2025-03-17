import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBell,
  faCartArrowDown,
  faCashRegister,
  faChartLine,
  faChartPie,
  faCubes,
  faListAlt,
  faSignOutAlt,
  faSyncAlt,
  faUser,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import React, { useContext, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../context/AuthContext";
import { faSalesforce } from "@fortawesome/free-brands-svg-icons";

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
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { username } = useAuth();
  console.log(username, "username");

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster richColors position="bottom-right" />

      {/* Sidebar */}
      <div
        className={`bg-gray-200 shadow-lg ${
          isSidebarCollapsed ? "w-16" : "w-64"
        } transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="px-3 rounded-lg border border-gray-600 hover:bg-gray-300 transition-all duration-200 focus:outline-none"
          >
            {isSidebarCollapsed ? (
              <FontAwesomeIcon icon={faArrowRight} />
            ) : (
              <FontAwesomeIcon icon={faArrowLeft} />
            )}
          </button>
        </div>

        <nav className="flex-1">
          {filteredTabs
            .filter((tab) => tab.path != "/")
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
                {!isSidebarCollapsed && (
                  <span className="ml-2">{tab.text}</span>
                )}
              </Link>
            ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-300">
          {filteredTabs
            .filter((tab) => tab.path == "/")
            .map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`flex items-center w-full p-4 rounded-lg hover:bg-gray-300 transition-all duration-200 ${
                  isSidebarCollapsed ? "justify-center" : ""
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="ml-2">{tab.text}</span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Main Content Area with Navbar */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <div className="bg-gray-200 shadow-sm px-6 py-1 flex justify-end items-center border-b">
          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            {/* <button className="relative text-gray-700 hover:text-blue-600">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                3
              </span>
            </button> */}

            {/* User Profile */}
            <div className="relative group">
              <div className="flex justify-center items-center">
                {username && (
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                    {/* Circular Avatar with Initial Letter */}
                    <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full text-lg font-semibold uppercase">
                      {username[0]}
                    </div>
                    <span className="hidden md:inline-block font-semibold">
                      {username}
                    </span>
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              {/* <div className="absolute right-0 mt-2 hidden group-hover:block bg-white shadow-lg rounded-lg w-40 border border-gray-200">
                <button className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left">
                  Profile
                </button>
                <button className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left">
                  Settings
                </button>
                <button className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left">
                  Logout
                </button>
              </div> */}
            </div>
          </div>
        </div>

        {/* Main Page Content */}
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">{activeTab.text}</h1>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
