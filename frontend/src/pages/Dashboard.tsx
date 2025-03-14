import React from 'react';

// Reusable Card Component
interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, bgColor = 'bg-white' }) => {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-md flex items-center justify-between`}>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  );
};

// Sales Chart Component (Placeholder)
const SalesChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Sales Chart (Last 7 Days)</h2>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Chart Placeholder</p>
      </div>
    </div>
  );
};

// Recent Transactions Component
const RecentTransactions: React.FC = () => {
  const transactions = [
    { id: 1, description: 'Sale #1234', amount: '$150.00', date: '2023-10-01' },
    { id: 2, description: 'Sale #1235', amount: '$200.00', date: '2023-10-02' },
    { id: 3, description: 'Sale #1236', amount: '$75.00', date: '2023-10-03' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex justify-between py-2 border-b last:border-b-0">
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-gray-500">{transaction.date}</p>
            </div>
            <p className="font-semibold">{transaction.amount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Quick Action Buttons Component
const QuickActions: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="flex space-x-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          New Sale
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
          Add Product
        </button>
      </div>
    </div>
  );
};

// Dashboard Page
const Dashboard: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card
          title="Total Sales"
          value="$1,250.00"
          icon={<span>💰</span>}
          bgColor="bg-blue-50"
        />
        <Card
          title="Low Stock Items"
          value={5}
          icon={<span>⚠️</span>}
          bgColor="bg-yellow-50"
        />
        <Card
          title="Pending Orders"
          value={3}
          icon={<span>📦</span>}
          bgColor="bg-red-50"
        />
      </div>

      {/* Sales Chart */}
      <div className="mb-6">
        <SalesChart />
      </div>

      {/* Recent Transactions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;