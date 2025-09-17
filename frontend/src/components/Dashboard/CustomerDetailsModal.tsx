import React, { useState, useEffect } from "react";
import Modal from "../POSInterface/Modal";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faReceipt, faCalendar, faCreditCard, faRupeeSign } from "@fortawesome/free-solid-svg-icons";

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
  totalPurchases?: number;
  totalSpent?: number;
}

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  isLoading?: boolean;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (isOpen && customer && activeTab === "purchases" && !customer.Sales) {
      fetchSalesHistory();
    }
  }, [isOpen, customer, activeTab]);

  const fetchSalesHistory = async () => {
    if (!customer) return;
    
    setIsLoadingSales(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/customers/${customer.id}/sales`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || []);
      } else {
        toast.error("Failed to fetch sales history");
      }
    } catch (error) {
      console.error("Error fetching sales history:", error);
      toast.error("Error loading sales history");
    } finally {
      setIsLoadingSales(false);
    }
  };

  const getSalesData = () => {
    // Prefer the detailed sales data from props if available
    if (customer?.Sales) {
      return customer.Sales;
    }
    // Otherwise use the locally fetched sales
    return sales;
  };

  const getTotalPurchases = () => {
    if (customer?.totalPurchases !== undefined) {
      return customer.totalPurchases;
    }
    return getSalesData().length;
  };

  const getTotalSpent = () => {
    if (customer?.totalSpent !== undefined) {
      return customer.totalSpent;
    }
    return getSalesData().reduce((total, sale) => total + sale.totalAmount, 0);
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[90vh] overflow-y-auto w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 text-2xl mr-3" />
            <span className="text-gray-600">Loading customer details...</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Customer Information
              </button>
              <button
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "purchases"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("purchases")}
              >
                Purchase History
              </button>
              <button
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "stats"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("stats")}
              >
                Statistics
              </button>
            </div>

            {/* Customer Details Tab */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Full Name</label>
                        <p className="text-lg font-medium">{customer.name || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Phone Number</label>
                        <p className="text-lg font-medium text-blue-600">{customer.phone}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Address</label>
                        <p className="text-lg">{customer.address || "No address provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Financial Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Current Debt</label>
                        <p className={`text-lg font-semibold ${customer.debtAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                          ₹{customer.debtAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Account Status</label>
                        <p className={`text-lg font-medium ${customer.isBlocked ? "text-red-600" : "text-green-600"}`}>
                          {customer.isBlocked ? "Blocked" : "Active"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Last Purchase</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FontAwesomeIcon icon={faCalendar} className="mr-2 w-4" />
                        <span>
                          {customer.lastPurchaseDate
                            ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : "No purchases yet"}
                        </span>
                      </div>
                      {customer.lastPurchaseAmount && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FontAwesomeIcon icon={faRupeeSign} className="mr-2 w-4" />
                          <span>₹{customer.lastPurchaseAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === "purchases" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Purchase History</h3>
                  <span className="text-sm text-gray-500">
                    {getTotalPurchases()} total purchases
                  </span>
                </div>

                {isLoadingSales ? (
                  <div className="flex justify-center items-center py-12">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 text-xl mr-3" />
                    <span className="text-gray-600">Loading purchase history...</span>
                  </div>
                ) : getSalesData().length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getSalesData().map((sale) => (
                      <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">Order #{sale.id}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <FontAwesomeIcon icon={faCalendar} className="mr-2 w-3" />
                              {new Date(sale.date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">
                              ₹{sale.totalAmount.toFixed(2)}
                            </p>
                            <div className="flex items-center justify-end text-sm text-gray-500 mt-1">
                              <FontAwesomeIcon icon={faCreditCard} className="mr-1 w-3" />
                              {sale.paymentMethod}
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.products.map((product) => (
                                <tr key={product.id} className="border-t border-gray-100">
                                  <td className="p-2 font-medium">{product.name}</td>
                                  <td className="p-2">₹{product.price.toFixed(2)}</td>
                                  <td className="p-2">{product.quantity}</td>
                                  <td className="p-2 font-medium">₹{product.subtotal.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faReceipt} className="text-gray-300 text-4xl mb-3" />
                    <p className="text-gray-500 text-lg">No purchase history available</p>
                    <p className="text-sm text-gray-400 mt-1">This customer hasn't made any purchases yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{getTotalPurchases()}</div>
                  <div className="text-sm text-blue-800 font-medium">Total Purchases</div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ₹{getTotalSpent().toFixed(2)}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Total Amount Spent</div>
                </div>

                <div className="bg-red-50 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    ₹{customer.debtAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-red-800 font-medium">Outstanding Debt</div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg text-center md:col-span-2 lg:col-span-1">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {customer.lastPurchaseDate ? 'Regular' : 'New'}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Customer Type</div>
                </div>

                {customer.lastPurchaseDate && (
                  <div className="bg-orange-50 p-6 rounded-lg text-center md:col-span-2 lg:col-span-2">
                    <div className="text-xl font-bold text-orange-600 mb-2">
                      {new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-orange-800 font-medium">Last Purchase Date</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CustomerDetailsModal;