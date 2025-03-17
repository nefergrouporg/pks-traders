import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/Dashboard/card";
import SalesChart from "../components/Dashboard/SalesChart";
import RecentTransactions from "../components/Dashboard/RecentTransactions";
import DownloadReport from "../components/Dashboard/DownloadReport";
import { baseUrl } from "../../utils/services";
import UpiIdComponent from "../components/UpiIdSetup";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get<Stats>(
          `${baseUrl}/api/dashboard/stats`
        );
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card
          title="Total Sales"
          value={`₹${stats.totalSales.toFixed(2)}`}
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
      <DownloadReport />

      {/* Recent Transactions & Sales Chart */}
      <div className="mb-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SalesChart />
        </div>
        <div className="col-span-1">
          <RecentTransactions />
        </div>
      </div>
      <UpiIdComponent></UpiIdComponent>
    </div>
  );
};

export default Dashboard;
