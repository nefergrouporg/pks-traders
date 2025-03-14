import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faChartPie, faUser } from '@fortawesome/free-solid-svg-icons'
import React, { useState } from "react";
import Dashboard from './Dashboard';
import ProductManagement from './ProductManagement';
import POSInterface from './POSInterface';
import { faGrav } from '@fortawesome/free-brands-svg-icons';
import UserManagement from './UserManagment';
import { Toaster } from 'sonner';

// Define the type for the tabs
type Tab = {
  id: number;
  icon: React.ReactNode;
  text: string;
  content: React.ReactNode;
};

// Mock tabs data
const tabs: Tab[] = [
  {
    id: 1,
    icon: <FontAwesomeIcon icon={faChartPie} className=''/>,
    text: "Dashboard",
    content: <Dashboard></Dashboard>,
  },
  {
    id: 2,
    icon: <FontAwesomeIcon icon={faChartPie} className=''/>,
    text: "Products",
    content: <ProductManagement></ProductManagement>,
  },
  {
    id: 3,
    icon: <FontAwesomeIcon icon={faUser} className=''/>,
    text: "POS  ",
    content: <POSInterface></POSInterface>,
  },
  {
    id: 4,
    icon: <FontAwesomeIcon icon={faUser} className=''/>,
    text: "User Management  ",
    content: <UserManagement></UserManagement>,
  },
];

const Home: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]); // Default selected tab
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar collapse state

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster richColors position='bottom-left'/>
      {/* Sidebar */}
      <div
        className={`bg-gray-200 shadow-lg ${
          isSidebarCollapsed ? "w-16" : "w-64"
        } transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="px-3 rounded-lg border border-gray-600 hover:bg-gray-300 transition-all duration-200 focus:outline-none"
          >
            {isSidebarCollapsed ? <FontAwesomeIcon icon={faArrowRight} className="text-sm" /> : <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />}
          </button>
        </div>
        <nav>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setSelectedTab(tab)}
              className={`flex items-center p-4 cursor-pointer ${
                selectedTab.id === tab.id ? "bg-blue-900 text-white" : "hover:bg-gray-300 transition-all duration-200"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {!isSidebarCollapsed && (
                <span className="ml-2">{tab.text}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">{selectedTab.text}</h1>
        {selectedTab.content}
      </div>
    </div>
  );
};

export default Home;