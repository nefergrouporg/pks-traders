// SalesList.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../../utils/services";
// import { Sale, SaleItem, Payment } from './types';

// types.ts
export interface Sale {
  id: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "upi" | "qr";
  createdAt: string;
  User: User;
  SaleItems: SaleItem[];
  Payment?: Payment;
  customerId?: string;
}

export interface SaleItem {
  quantity: number;
  price: number;
  Product: Product;
}

export interface Product {
  id: number;
  name: string;
  unitType: "pcs" | "kg";
}

export interface User {
  id: number;
  username: string;
}

export interface Payment {
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  paymentMethod: "cash" | "card" | "upi" | "qr";
}

const SalesList = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get<Sale[]>(`${baseUrl}/api/sales`);
        setSales(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch sales data");
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filteredSales = sales?.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      (sale.customerId &&
        sale.customerId.toLowerCase().includes(searchLower)) ||
      sale.User.username.toLowerCase().includes(searchLower) ||
      sale.SaleItems.some((item) =>
        item.Product.name.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search sales by ID, customer, user, or product..."
          className="w-full p-2 sm:p-3 border bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-400 text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <div key={sale.id} className="bg-white rounded-lg shadow-md p-4">
            {/* Sale Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Sale # {sale.id}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm sm:text-base text-gray-600">
                  Sold by: {sale.User.username}
                </p>
                {sale.customerId && (
                  <p className="text-sm sm:text-base text-gray-600">
                    Customer ID: {sale.customerId}
                  </p>
                )}
              </div>

              {/* Sale Amount and Payment Status */}
              <div className="text-right mt-4 sm:mt-0">
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  ₹{sale.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm uppercase text-gray-600 mb-2">
                  {sale.paymentMethod}
                </p>
                {sale.Payment && (
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      sale.Payment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : sale.Payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sale.Payment.status}
                  </span>
                )}
              </div>
            </div>

            {/* Items Purchased */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 text-gray-800 text-sm sm:text-base">
                Items Purchased:
              </h3>
              <div className="space-y-2">
                {sale.SaleItems.map((item: SaleItem) => (
                  <div
                    key={item.Product.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm sm:text-base">
                        {item.Product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.Product.unitType} @ ₹
                        {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details (Optional) */}
            {/* {sale.Payment && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2 text-gray-800">Payment Details:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Method: {sale.Payment.paymentMethod}</p>
                  {sale.Payment.transactionId && (
                    <p>Transaction ID: {sale.Payment.transactionId}</p>
                  )}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesList;
