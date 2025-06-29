import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { baseUrl } from "../../../utils/services";

interface SalesDataPoint {
  label: string;
  sales: number;
}

interface SalesChartProps {
  selectedBranchId?: number | null;
}

const periods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const paymentMethods = [
  { value: "all", label: "All Payment Methods" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
];

const SalesChart: React.FC<SalesChartProps> = ({ selectedBranchId }) => {
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedPayment, setSelectedPayment] = useState("all");

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          paymentMethod: selectedPayment,
        });

        // Add branchId to params if selected
        if (selectedBranchId) {
          params.append("branchId", selectedBranchId.toString());
        }

        const response = await fetch(
          `${baseUrl}/api/dashboard/sales-data?${params}`
        );
        if (!response.ok) throw new Error("Failed to fetch sales data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [selectedPeriod, selectedPayment, selectedBranchId]);

  const getChartTitle = () => {
    const periodLabel = periods.find((p) => p.value === selectedPeriod)?.label;
    return `Sales Chart (${periodLabel})`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black bg-opacity-80 px-2 py-1 rounded text-white text-sm">
          ₹{payload[0].value.toFixed(2)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4 pb-2 text-black">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
        <h2 className="text-xl font-medium text-center sm:text-left">
          {getChartTitle()}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 w-full sm:w-auto"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 w-full sm:w-auto"
          >
            {paymentMethods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Section */}
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#999", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#999", fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
              domain={[0, (dataMax) => Math.ceil(dataMax / 1000) * 1000 + 1000]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="sales"
              fill="#000000"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Loading and Error States */}
      {loading && <div className="text-center py-4">Loading sales data...</div>}

      {error && (
        <div className="text-red-500 text-center py-4">Error: {error}</div>
      )}
    </div>
  );
};
export default SalesChart;
