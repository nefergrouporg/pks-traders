import React, { useState } from "react";
import Modal from "../POSInterface/Modal";
import axios from "axios";
import { toast } from "sonner";
import DeleteConfirmationModal from "../Dashboard/DeleteConfirmationModal";

interface Sale {
  id: number;
  date: string;
  totalAmount: number;
  paymentMethod: string;
  products: SaleProduct[];
}

interface SaleProduct {
  id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  lastPurchaseDate?: string;
  lastPurchaseAmount?: number;
  debtAmount: number;
  isBlocked?: boolean;
  Sales?: Sale[];
}

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  if (!customer) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 max-h-[90vh] overflow-y-auto w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Customer Details</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 ${
                activeTab === "details"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("details")}
            >
              Customer Details
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === "purchases"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("purchases")}
            >
              Purchase History
            </button>
          </div>

          {/* Customer Details Tab */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="text-base">{customer.name || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="text-base">{customer.phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="text-base">{customer.address || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Last Purchase Date
                  </h3>
                  <p className="text-base">
                    {customer.lastPurchaseDate
                      ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                      : "No purchases"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Last Purchase Amount
                  </h3>
                  <p className="text-base">
                    {customer.lastPurchaseAmount
                      ? `₹${customer.lastPurchaseAmount.toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Debt Amount
                  </h3>
                  <p
                    className={`text-base ${
                      customer.debtAmount > 0
                        ? "text-red-600 font-semibold"
                        : ""
                    }`}
                  >
                    ₹{customer.debtAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase History Tab */}
          {activeTab === "purchases" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Purchase History</h3>

              {customer.Sales && customer.Sales.length > 0 ? (
                <div className="space-y-6">
                  {customer.Sales.map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium">Order #{sale.id}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.date).toLocaleDateString()} -{" "}
                            {new Date(sale.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{sale.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sale.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 text-left">Product</th>
                              <th className="p-2 text-left">Price</th>
                              <th className="p-2 text-left">Quantity</th>
                              <th className="p-2 text-left">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.products &&
                              sale.products.map((product) => (
                                <tr key={product.id} className="border-t">
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2">
                                    ₹{product.price.toFixed(2)}
                                  </td>
                                  <td className="p-2">{product.quantity}</td>
                                  <td className="p-2">
                                    ₹{product.subtotal.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No purchase history available
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CustomerDetailsModal;
