import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faMoneyBill, faEdit } from "@fortawesome/free-solid-svg-icons";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal";
import ConfirmationModal from "../components/Dashboard/ConfirmationModal";
import CustomerDetailsModal from "../components/Dashboard/CustomerDetailsModal";
import DebtPaymentModal from "../components/Dashboard/DebtPaymentModal";

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

interface NewCustomer {
  name: string;
  phone: string;
  address?: string;
}

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersDetails, setCustomersDetails] = useState([]);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [customerToToggle, setCustomerToToggle] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: "",
    phone: "",
    address: "",
  });

  const [editCustomer, setEditCustomer] = useState<NewCustomer>({
    name: "",
    phone: "",
    address: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(response.data?.customers.filter((user) => !user.isDeleted));
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${baseUrl}/api/customers`,
        newCustomer,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        toast.success("Customer created successfully");
        setIsAddCustomerModalOpen(false);
        setNewCustomer({
          name: "",
          phone: "",
          address: "",
        });
        fetchCustomers();
      }
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error.response?.data?.message || "Failed to create customer");
    }
  };

  const openEditCustomerModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditCustomer({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const customer = {
      id: selectedCustomer.id,
      ...editCustomer
    }
    try {
      const response = await axios.put(
        `${baseUrl}/api/customers/update`,
        customer,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        toast.success("Customer updated successfully");
        setIsEditCustomerModalOpen(false);
        fetchCustomers();
      }
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.response?.data?.message || "Failed to update customer");
    }
  };

  const handleToggleCustomer = async () => {
    if (!customerToToggle) return;
    try {
      const response = await axios.put(
        `${baseUrl}/api/customers/toggle-block/${customerToToggle}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerToToggle ? { ...c, isBlocked: !c.isBlocked } : c
          )
        );
        toast.success("Customer status updated");
      }
    } catch (error) {
      console.error("Error toggling customer status:", error);
      toast.error("Failed to toggle status");
    } finally {
      setIsConfirmationModalOpen(false);
      setCustomerToToggle(null);
    }
  };

  const handleDebtPaymentSuccess = () => {
    fetchCustomers(); // Refresh data after payment
  };

  const openCustomerDetails = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to fetch customer details");
    }
  };

  const openDebtModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDebtModalOpen(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name &&
        customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone &&
        customer.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.address &&
        customer.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search customers by name, phone, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-400 bg-white rounded-lg flex-1 text-sm sm:text-base text-black"
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
          onClick={() => setIsAddCustomerModalOpen(true)}
        >
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-left">Last Purchase</th>
                <th className="p-3 text-left">Debt Amount</th>
                <th className="p-3 text-left">Pay Debt</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {currentItems.map((customer) => (
                <tr key={customer.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{customer.name || "N/A"}</td>
                  <td className="p-3">{customer.phone}</td>
                  <td className="p-3">{customer.address || "N/A"}</td>
                  <td className="p-3">
                    {customer.lastPurchaseDate
                      ? `${new Date(
                          customer.lastPurchaseDate
                        ).toLocaleDateString()} - ₹${customer.lastPurchaseAmount?.toFixed(
                          2
                        )}`
                      : "No purchases"}
                  </td>
                  <td className="p-3">₹{customer.debtAmount.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => openDebtModal(customer)}
                      className={`
                        ${
                          customer.isBlocked || customer.debtAmount <= 0
                            ? "text-gray-600 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800"
                        }
                      `}
                      disabled={customer.isBlocked || customer.debtAmount <= 0}
                      title="Process Debt Payment"
                    >
                      <FontAwesomeIcon icon={faMoneyBill} />
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => openCustomerDetails(customer)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      onClick={() => openEditCustomerModal(customer)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit Customer"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-2 px-4 py-2 bg-gray-300 rounded-lg">
          {currentPage}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={indexOfLastItem >= filteredCustomers.length}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
      >
        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-5">Create New Customer</h2>
          <form onSubmit={handleAddCustomer} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone*</label>
                <input
                  type="tel"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Customer
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditCustomerModalOpen}
        onClose={() => setIsEditCustomerModalOpen(false)}
      >
        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-5">Edit Customer</h2>
          <form onSubmit={handleEditCustomer} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={editCustomer.name}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone*</label>
                <input
                  type="tel"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={editCustomer.phone}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, phone: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  rows={3}
                  value={editCustomer.address}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Update Customer
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirmation Modal for Block/Unblock */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleToggleCustomer}
        currentStatus={
          customers.find((c) => c.id === customerToToggle)?.isBlocked || false
        }
        title="Confirm Action"
        message={`Are you sure you want to ${
          customers.find((c) => c.id === customerToToggle)?.isBlocked
            ? "unblock"
            : "block"
        } this customer?`}
      />

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          customer={selectedCustomer}
        />
      )}

      {/* Debt Payment Modal */}
      {selectedCustomer && (
        <DebtPaymentModal
          isOpen={isDebtModalOpen}
          onClose={() => setIsDebtModalOpen(false)}
          customer={selectedCustomer}
          onSuccess={handleDebtPaymentSuccess}
        />
      )}
    </div>
  );
};

export default UserManagement;