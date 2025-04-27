import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faToggleOff,
  faToggleOn,
  faEye,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal";

interface Product {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice: number;
  category: string;
  stock: number;
  batchNumber: string;
  barcode: string;
  description: string;
  lowStockThreshold: number;
  supplierId: number;
  active: boolean;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  products?: Product[];
}

interface SupplierHistory {
  id: number;
  supplierId: number;
  quantity: number;
  amount: number;
  date: string;
  paymentStatus: string;
  Product: {
    name: string;
  };
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  currentStatus: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  currentStatus,
}) => {
  const action = currentStatus ? "Block" : "Unblock";
  const actionMessage =
    message ||
    `Are you sure you want to ${action.toLowerCase()} this supplier?`;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto"
    >
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Confirm {action}
        </h2>
        <p className="mb-6 text-sm sm:text-base">{actionMessage}</p>
        <div className="flex justify-end space-x-3 sm:space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${
              currentStatus ? "bg-red-500" : "bg-green-500"
            } text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:${
              currentStatus ? "bg-red-600" : "bg-green-600"
            } transition text-sm sm:text-base`}
          >
            {action}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const Suppliers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [supplierHistory, setSupplierHistory] = useState<SupplierHistory[]>([]);
  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [supplierToToggle, setSupplierToToggle] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [activeTab, setActiveTab] = useState("info");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/supplier`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const fetchSupplierHistory = async (supplierId: number) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/supplier/${supplierId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSupplierHistory(response.data.history);
    } catch (error) {
      console.error("Error fetching supplier history:", error);
      setSupplierHistory([]);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.contactPerson ||
      !formData.email ||
      !formData.phone
    ) {
      return toast.error("Required fields are missing");
    }

    try {
      const url = formData.id
        ? `${baseUrl}/api/supplier/${formData.id}`
        : `${baseUrl}/api/supplier`;
      const method = formData.id ? "put" : "post";
      const response = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(
          formData.id ? "Supplier updated successfully" : "Supplier created successfully"
        );
        setSupplierModalOpen(false);
        resetFormData();
        fetchSuppliers();
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleToggleSupplier = async () => {
    if (!supplierToToggle) return;

    try {
      const response = await axios.put(
        `${baseUrl}/api/supplier/${supplierToToggle}/toggle-block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Supplier status toggled successfully");
        setSuppliers((prevSuppliers) =>
          prevSuppliers.map((supplier) =>
            supplier.id === supplierToToggle
              ? { ...supplier, active: !supplier.active }
              : supplier
          )
        );
      } else {
        toast.error("There was a problem toggling the supplier status");
      }
    } catch (error) {
      console.error("Error toggling supplier status:", error);
      toast.error("Failed to toggle supplier status");
    } finally {
      setIsConfirmationModalOpen(false);
      setSupplierToToggle(null);
    }
  };

  const openDetailsModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierHistory(supplier.id);
    setDetailsModalOpen(true);
    setActiveTab("info");
  };

  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  const closeModal = () => {
    setSupplierModalOpen(false);
    resetFormData();
  };

  return (
    <>
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Supplier Management
          </h1>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg flex-1 text-sm sm:text-base"
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
            onClick={() => {
              setModalMode("create");
              resetFormData();
              setSupplierModalOpen(true);
            }}
          >
            Add Supplier
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm sm:text-base">Name</th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Contact Person
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">Email</th>
                  <th className="p-3 text-left text-sm sm:text-base">Phone</th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Address
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Actions
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((supplier) => (
                  <tr key={supplier.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm sm:text-base">
                      {supplier.name}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {supplier.contactPerson}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {supplier.email}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {supplier.phone}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {supplier.address}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailsModal(supplier)}
                          className="bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition text-sm sm:text-base flex items-center"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          Details
                        </button>
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setFormData({
                              id: supplier.id.toString(),
                              name: supplier.name,
                              contactPerson: supplier.contactPerson,
                              email: supplier.email,
                              phone: supplier.phone,
                              address: supplier.address,
                            });
                            setSupplierModalOpen(true);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base flex items-center"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      <button
                        onClick={() => {
                          setSupplierToToggle(supplier.id);
                          setIsConfirmationModalOpen(true);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={supplier.active ? faToggleOn : faToggleOff}
                          className={`text-2xl ${
                            supplier.active ? "text-green-500" : "text-red-500"
                          }`}
                        />
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
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer text-sm sm:text-base"
          >
            Previous
          </button>
          <span className="mx-2 px-4 py-2 bg-gray-300 rounded-lg text-lg font-medium cursor-pointer text-sm sm:text-base">
            {currentPage}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastItem >= filteredSuppliers.length}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer text-sm sm:text-base"
          >
            Next
          </button>
        </div>

        <Modal isOpen={isSupplierModalOpen} onClose={closeModal}>
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalMode === "create" ? "Create New Supplier" : "Edit Supplier"}
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleSupplierSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person*
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter complete address"
                />
              </div>
              <div className="flex justify-end mt-5 space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  {modalMode === "create" ? "Create Supplier" : "Update Supplier"}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
        >
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Supplier Details: {selectedSupplier?.name}
              </h2>
            </div>
            <div className="mb-6 border-b">
              <div className="flex space-x-6">
                <button
                  className={`py-2 px-1 font-medium ${
                    activeTab === "info"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("info")}
                >
                  Information
                </button>
                <button
                  className={`py-2 px-1 font-medium ${
                    activeTab === "products"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("products")}
                >
                  Products
                </button>
                <button
                  className={`py-2 px-1 font-medium ${
                    activeTab === "history"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  Supply History
                </button>
              </div>
            </div>
            {activeTab === "info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Contact Person:
                      </span>
                      <span>{selectedSupplier?.contactPerson}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Email:
                      </span>
                      <span>{selectedSupplier?.email}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Phone:
                      </span>
                      <span>{selectedSupplier?.phone}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Address:
                      </span>
                      <span>{selectedSupplier?.address}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Status:
                      </span>
                      <span
                        className={
                          selectedSupplier?.active
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {selectedSupplier?.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Supply Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Total Products:
                      </span>
                      <span>{selectedSupplier?.products?.length || 0}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Last Supply:
                      </span>
                      <span>
                        {supplierHistory.length > 0
                          ? new Date(
                              supplierHistory[0].date
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32 text-gray-600">
                        Active Products:
                      </span>
                      <span>
                        {selectedSupplier?.products?.filter((p) => p.active)
                          .length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "products" && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Products from this Supplier
                </h3>
                {selectedSupplier?.products &&
                selectedSupplier.products.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Name
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Category
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Wholesale Price
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Retail Price
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Stock
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedSupplier.products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm">{product.name}</td>
                            <td className="p-3 text-sm">{product.category}</td>
                            <td className="p-3 text-sm">
                              ₹{product?.wholeSalePrice?.toFixed(2)}
                            </td>
                            <td className="p-3 text-sm">
                              ₹{product?.retailPrice?.toFixed(2)}
                            </td>
                            <td className="p-3 text-sm">{product.stock}</td>
                            <td className="p-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  product.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-500">
                      No products found for this supplier.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "history" && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Supply History
                </h3>
                {supplierHistory.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Date
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Product
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Quantity
                          </th>
                          <th className="p-3 text-left text-sm font-medium text-gray-600">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {supplierHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-sm">
                              {item.Product?.name}
                            </td>
                            <td className="p-3 text-sm">{item.quantity}</td>
                            <td className="p-3 text-sm">
                              ₹{item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No supply history found for this supplier.
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => {
            setIsConfirmationModalOpen(false);
            setSupplierToToggle(null);
          }}
          onConfirm={handleToggleSupplier}
          currentStatus={
            supplierToToggle !== null
              ? suppliers.find((s) => s.id === supplierToToggle)?.active ??
                false
              : false
          }
          message={`Are you sure you want to ${
            suppliers.find((s) => s.id === supplierToToggle)?.active
              ? "block"
              : "unblock"
          } this supplier?`}
        />
      </div>
    </>
  );
};

export default Suppliers;