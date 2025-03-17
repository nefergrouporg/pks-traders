import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/Dashboard/card";
import SalesChart from "../components/Dashboard/SalesChart";
import RecentTransactions from "../components/Dashboard/RecentTransactions";
import DownloadReport from "../components/Dashboard/DownloadReport";
import { baseUrl } from "../../utils/services";
import SalesList from "../components/Dashboard/SalesList";

// Define TypeScript types
interface Stats {
  totalSales: number;
  lowStockCount: number;
  pendingPayments: number;
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
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get<Stats>(`${baseUrl}/api/dashboard/stats`);
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
          value={`$${stats.totalSales.toFixed(2)}`}
          icon={<span>💰</span>}
          bgColor="bg-blue-50"
        />
        <Card
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={<span>⚠️</span>}
          bgColor="bg-yellow-50"
        />
        <Card
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<span>📦</span>}
          bgColor="bg-red-50"
        />
      </div>

      {/* Download Report Section */}
      <DownloadReport/>

      {/* Recent Transactions & Sales Chart */}
      <div className="mb-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SalesChart />
        </div>
        <div className="col-span-1">
          <RecentTransactions />
        </div>
      </div>
      <SalesList></SalesList>

      
    </div>
  );
};

export default Dashboard;
