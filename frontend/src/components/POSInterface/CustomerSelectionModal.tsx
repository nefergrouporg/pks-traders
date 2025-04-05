import React from "react";
import axios from "axios";
import { toast } from "sonner";
import { baseUrl } from "../../../utils/services";

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: any;
  onSelectCustomer: (customer: any) => void;
  customers: any[];
  fetchCustomers: () => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedCustomer,
  onSelectCustomer,
  customers,
  fetchCustomers,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [isNewCustomerMode, setIsNewCustomerMode] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    address: "",
    debtAmount: 0
  });

  const handleCustomerSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = customers.filter(
      (customer) =>
        customer.phone.includes(term) ||
        (customer.name &&
          customer.name.toLowerCase().includes(term.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  const token = localStorage.getItem("token");

  const createNewCustomer = async () => {
    if (!newCustomer.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/customers`,
        newCustomer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.exists) {
        toast.warning("Customer already exists");
        onSelectCustomer(response.data.customer);
        onClose();
        return;
      }

      if(response.status === 201){
        toast.success(response.data.message || "Customer created successfully");
        fetchCustomers();
        onSelectCustomer(response.data.customer);
      } else {
        toast.error(response.data.message || "There is problem while creating customer");
      }

      setNewCustomer({ name: "", phone: "", address: "", debtAmount: 0 });
      setIsNewCustomerMode(false);
      onClose();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(error.response?.data?.error || "Failed to create customer");
    }
  };

  const updateCustomerDebt = async () => {
    try {
      const response = await axios.put(
        `${baseUrl}/api/customers/debt/${selectedCustomer.id}`,
        { debtAmount: newCustomer.debtAmount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if(response.status === 200){
        toast.success("Customer debt updated successfully");
        fetchCustomers();
        onSelectCustomer(response.data.customer);
        setIsEditMode(false);
        onClose();
      }
    } catch (error) {
      console.error("Error updating customer debt:", error);
      toast.error(error.response?.data?.error || "Failed to update customer debt");
    }
  };

  const handleEditCustomer = (customer) => {
    setNewCustomer({
      name: customer.name || "",
      phone: customer.phone,
      address: customer.address || "",
      debtAmount: customer.debtAmount || 0
    });
    setIsEditMode(true);
    setIsNewCustomerMode(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditMode ? "Edit Customer" : 
             isNewCustomerMode ? "Add New Customer" : "Select Customer"}
          </h2>
          <button
            onClick={() => {
              onClose();
              setIsNewCustomerMode(false);
              setIsEditMode(false);
              setSearchTerm("");
              setSearchResults([]);
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {!isNewCustomerMode ? (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                placeholder="Search by phone or name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto mb-4">
              {searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((customer) => (
                    <li
                      key={customer.id}
                      className="py-2 px-1 hover:bg-gray-100 cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <div 
                          onClick={() => {
                            onSelectCustomer(customer);
                            onClose();
                            setSearchTerm("");
                            setSearchResults([]);
                          }}
                          className="flex-1"
                        >
                          <div className="font-medium">
                            {customer.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {customer.phone}
                          </div>
                          {customer.debtAmount > 0 && (
                            <div className="text-sm text-red-600">
                              Debt: ₹{customer.debtAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 px-2"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchTerm ? (
                <p className="text-center py-2">No customers found</p>
              ) : null}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  onSelectCustomer(null);
                  onClose();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Use Guest Customer
              </button>
              <button
                onClick={() => {
                  setIsNewCustomerMode(true);
                  setIsEditMode(false);
                  setNewCustomer({ name: "", phone: "", address: "", debtAmount: 0 });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add New Customer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-4 z-50 bg-white text-black">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  required
                  disabled={isEditMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debt Amount (₹)
                </label>
                <input
                  type="number"
                  value={newCustomer.debtAmount}
                  onChange={(e) =>
                    setNewCustomer({ 
                      ...newCustomer, 
                      debtAmount: parseFloat(e.target.value) || 0 
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setIsNewCustomerMode(false);
                  setIsEditMode(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 z-50"
              >
                Back
              </button>
              <button
                onClick={isEditMode ? updateCustomerDebt : createNewCustomer}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 z-50"
              >
                {isEditMode ? "Update Customer" : "Create Customer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerSelectionModal;