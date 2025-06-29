import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/Dashboard/Card";
import SalesChart from "../components/Dashboard/SalesChart";
import RecentTransactions from "../components/Dashboard/RecentTransactions";
import DownloadReport from "../components/Dashboard/DownloadReport";
import BranchSelector from "../components/Dashboard/BranchSelector";
import { baseUrl } from "../../utils/services";
import UpiIdComponent from "../components/UpiIdSetup";
import BranchAddress from "../components/BranchAddress";
import { useAuth } from "../context/AuthContext";

interface LowStockProduct {
  name: string;
  batchNumber: string;
  stock: number;
}

interface Stats {
  totalSales: number;
  lowStockCount: number;
  pendingPayments: number;
  lowStockProducts: LowStockProduct[];
}

interface SalesData {
  label: string;
  sales: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    lowStockCount: 0,
    pendingPayments: 0,
    lowStockProducts: [],
  });
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const { role, branch } = useAuth();

  // Set default branch for non-admin users
  useEffect(() => {
    if (role !== "admin" && branch) {
      setSelectedBranchId(branch.id);
    }
  }, [role, branch]);

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const fetchData = async () => {
    try {
      const params = selectedBranchId ? { branchId: selectedBranchId } : {};
      const statsRes = await axios.get<Stats>(
        `${baseUrl}/api/dashboard/stats`,
        { params }
      );
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const handleBranchChange = (branchId: number | null) => {
    setSelectedBranchId(branchId);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {/* Branch Selector for Admin Users */}
      <BranchSelector
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
      />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card
          title="Total Sales"
          value={`₹${stats.totalSales ? stats.totalSales.toFixed(2) : 0}`}
          icon={<span>💰</span>}
          bgColor="bg-blue-50"
        />

        {/* Low Stock Items Card with Hover Tooltip */}
        <div className="relative group">
          <Card
            title="Low Stock Items"
            value={stats.lowStockCount}
            icon={<span>⚠️</span>}
            bgColor="bg-yellow-50"
          />
          {stats.lowStockProducts.length > 0 && (
            <div className="absolute left-0 mt-2 hidden group-hover:block bg-white shadow-lg rounded-lg p-4 w-72 border border-gray-200 transition-all duration-200">
              <h4 className="text-lg font-semibold mb-2">Low Stock Items</h4>
              <ul className="text-sm">
                {stats.lowStockProducts.map((product, index) => (
                  <li key={index} className="mb-1">
                    <span className="font-semibold">{product.name}</span> -
                    Batch: {product.batchNumber || "N/A"}, Qty: {product.stock}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Card
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<span>📦</span>}
          bgColor="bg-red-50"
        />
      </div>

      {/* Download Report Section */}
      <DownloadReport selectedBranchId={selectedBranchId} />

      {/* Recent Transactions & Sales Chart */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 sm:col-span-2">
          <SalesChart selectedBranchId={selectedBranchId} />
        </div>
        <div className="col-span-1">
          <RecentTransactions selectedBranchId={selectedBranchId} />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <UpiIdComponent />
        <BranchAddress />
      </div>
    </div>
  );
};

export default Dashboard;
