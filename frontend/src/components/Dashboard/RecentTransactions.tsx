import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../utils/services";

// Define TypeScript interface for a transaction
interface Transaction {
  id: number;
  createdAt: string;
  totalAmount: number;
}

const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<Transaction[]>(
          `${baseUrl}/api/dashboard/recent-transactions`
        );
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <ul>
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex flex-col sm:flex-row justify-between py-2 border-b last:border-b-0"
            >
              <div className="mb-2 sm:mb-0">
                <p className="font-medium">{`Sale #${transaction.id}`}</p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.createdAt)
                    .toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    .replace(/\//g, "-")}
                </p>
              </div>
              <p className="font-semibold sm:text-right">
                ₹{transaction.totalAmount.toFixed(2)}
              </p>
            </li>
          ))
        ) : (
          <p>No recent transactions available.</p>
        )}
      </ul>
    </div>
  );
};

export default RecentTransactions;
