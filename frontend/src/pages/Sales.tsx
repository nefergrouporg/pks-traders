import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../../utils/services";

// types.ts
export interface Sale {
  id: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "upi" | "debit";
  purchaseDate: string;
  user: User;
  items: SaleItem[];
  payments?: Payment[];
  customer?: Customer;
}

export interface SaleItem {
  quantity: number;
  price: number;
  product: Product;
}

export interface Customer {
  name: string;
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
  amount: number;
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  paymentMethod: "cash" | "card" | "upi" | "debit";
}

const SalesList = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Modal states
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get<Sale[]>(`${baseUrl}/api/sales`);
        console.log(response.data[0]);
        setSales(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError("Failed to fetch sales data");
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const filteredSales = sales?.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      (sale.customer?.name &&
        sale.customer.name.toLowerCase().includes(searchLower)) ||
      sale.user?.username.toLowerCase().includes(searchLower) ||
      sale.items?.some((item) =>
        item.product?.name.toLowerCase().includes(searchLower)
      )
    );
  });

  // Get current sales for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Modal functions
  const openSaleDetailsModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeSaleDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Search Bar and Items Per Page */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <input
          type="text"
          placeholder="Search sales by ID, customer, user, or product..."
          className="w-full md:w-3/4 p-2 sm:p-3 border bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-400 text-sm sm:text-base mb-3 md:mb-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="w-full md:w-1/5 p-2 sm:p-3 border bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-400 text-sm sm:text-base"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(parseInt(e.target.value));
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* No Sales Message */}
      {(sales.length === 0 || filteredSales.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 12H4M8 16l-4-4 4-4"
            />
          </svg>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {sales.length === 0
              ? "No sales have happened yet"
              : "No sales match your search"}
          </h3>
          <p className="text-gray-500">
            {sales.length === 0
              ? "There are currently no sales records in the system."
              : "Try adjusting your search criteria to find what you're looking for."}
          </p>
        </div>
      )}

      {/* Sales List */}
      {currentItems.length > 0 && (
        <div className="space-y-4">
          {currentItems.map((sale) => (
            <div key={sale.id} className="bg-white rounded-lg shadow-md p-4">
              {/* Sale Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Sale # {sale.id}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {new Date(sale.purchaseDate).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-600">
                    Sold by: {sale?.user?.username}
                  </p>
                  {sale.customer?.name && (
                    <p className="text-sm sm:text-base text-gray-600">
                      Customer: {sale.customer.name}
                    </p>
                  )}
                </div>

                {/* Sale Amount and Payment Status */}
                <div className="text-right mt-4 sm:mt-0">
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    ₹{sale.totalAmount.toFixed(2)}
                  </p>

                  {(sale?.payments?.length ?? 0) > 0 && (
                    <div className="text-sm uppercase text-gray-600 mb-2 space-y-1">
                      {(sale?.payments ?? []).map((payment, index) => (
                        <p key={index}>
                          {payment.paymentMethod} - ₹{payment.amount}
                        </p>
                      ))}
                    </div>
                  )}

                  {sale.payments?.[0] && (
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        sale.payments[0].status === "completed"
                          ? "bg-green-100 text-green-800"
                          : sale.payments[0].status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.payments[0].status}
                    </span>
                  )}
                </div>
              </div>

              {/* Sale Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {sale.items.length}{" "}
                    {sale.items.length === 1 ? "item" : "items"} purchased
                  </span>
                  <button
                    onClick={() => openSaleDetailsModal(sale)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sale Details Modal - Fixed positioning and improved responsiveness */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeSaleDetailsModal}
          ></div>

          {/* Modal content - Adjusted positioning for sidebar */}
          <div className="absolute inset-0 overflow-auto flex items-center justify-center md:justify-start md:ml-64">
            <div
              className="relative bg-white rounded-lg shadow-xl w-full mx-4 md:mx-auto max-w-3xl max-h-full md:max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                  Sale #{selectedSale.id} Details
                </h3>
                <button
                  onClick={closeSaleDetailsModal}
                  className="text-gray-600 hover:text-gray-900 p-1"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Scrollable content */}
              <div className="p-4 overflow-auto max-h-[calc(100vh-12rem)]">
                {/* Sale Information */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Date:{" "}
                        {new Date(selectedSale.purchaseDate).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sold by: {selectedSale.user?.username}
                      </p>
                      {selectedSale.customer?.name && (
                        <p className="text-sm text-gray-600">
                          Customer: {selectedSale.customer.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ₹{selectedSale.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm uppercase text-gray-600">
                        Payment: {selectedSale.paymentMethod}
                      </p>
                      {(selectedSale.payments?.length ?? 0) > 0 && (
                        <div className="mt-2 space-y-1">
                          {(selectedSale.payments ?? []).map(
                            (payment, index) => (
                              <span
                                key={index}
                                className={`px-2 py-1 rounded text-sm inline-block ${
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                ₹{payment.amount} - {payment.paymentMethod}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <h4 className="font-medium mb-3 text-gray-800">
                    Items Purchased:
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedSale.items.map((item, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              {item.product?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {item.quantity} {item.product?.unitType}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              ₹{item.price?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              ₹{(item.quantity * item.price)?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                          >
                            Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-600">
                            ₹{selectedSale.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-4 py-3 border-t flex justify-end">
                <button
                  onClick={closeSaleDetailsModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredSales.length > 0 && (
        <div className="flex justify-between items-center mt-6 flex-wrap">
          <div className="text-sm text-gray-600 mb-3 md:mb-0">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredSales.length)} of{" "}
            {filteredSales.length} sales
          </div>

          <div className="flex gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Previous
            </button>

            <div className="flex gap-1">
              {/* Show limited page numbers with ellipsis */}
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                // Always show first page, last page, current page and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 &&
                    pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  (pageNumber === currentPage - 2 && currentPage > 3) ||
                  (pageNumber === currentPage + 2 &&
                    currentPage < totalPages - 2)
                ) {
                  // Show ellipsis
                  return (
                    <span key={pageNumber} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
