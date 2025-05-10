import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
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
  isDeleted: boolean;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
}

interface StockEntry {
  id: number;
  productId: number;
  supplierId: number;
  quantity: number;
  purchasePrice: number;
  expiryDate: string;
  batchNumber: string;
  note: string;
  createdAt: string;
}

interface UploadError {
  reason: string;
  row: any;
}

// Stock Entry Management Page
const StockEntryManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isStockEntryModalOpen, setStockEntryModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    supplierId: "",
    quantity: "",
    purchasePrice: "",
    expiryDate: "",
    batchNumber: "",
    note: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [itemsPerPage] = useState(8);
  const token = localStorage.getItem("token");

  const fetchStockEntries = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/entryStock`);
      setStockEntries(response.data);
    } catch (error) {
      console.error("Error fetching stock entries:", error);
      toast.error("Failed to load stock entries");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get<{ products: Product[] }>(
        `${baseUrl}/api/products`
      );
      setProducts(
        response.data.products.filter((product) => !product.isDeleted)
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setErrors([]);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/supplier`);
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  useEffect(() => {
    fetchStockEntries();
    fetchProducts();
    fetchSuppliers();
  }, []);

  // Filter stock entries based on search and batch
  const filteredStockEntries = stockEntries?.filter((entry) => {
    const product = products.find((p) => p.id === entry.productId);
    const productNameMatch =
      product?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const batchMatch = batchFilter ? entry.batchNumber === batchFilter : true;
    return productNameMatch && batchMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStockEntries?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["quantity", "purchasePrice"];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? value
          ? Number(value)
          : ""
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${baseUrl}/api/entryStock/bulk-upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message || "Upload successful");
        fetchStockEntries()
        setIsModalOpen(false);
      } else {
        toast.error(res.data.message || "Upload failed");
      }
      setErrors(res.data.errors || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  const handleCreateStockEntry = async (e) => {
    e.preventDefault();

    if (
      !formData.productId ||
      !formData.supplierId ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !formData.batchNumber
    ) {
      return toast.error("All required fields must be filled");
    }

    try {
      const response = await axios.post(`${baseUrl}/api/entryStock`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        toast.success("Stock entry created successfully");
        setStockEntryModal(false);
        resetFormData();
        fetchStockEntries();
        fetchProducts();
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // Open edit modal and populate form with entry data
  const handleEditClick = (entry: StockEntry) => {
    setCurrentEditId(entry.id);
    setFormData({
      productId: entry.productId.toString(),
      supplierId: entry.supplierId.toString(),
      quantity: entry.quantity.toString(),
      purchasePrice: entry.purchasePrice.toString(),
      expiryDate: entry.expiryDate ? entry.expiryDate.split('T')[0] : "",
      batchNumber: entry.batchNumber,
      note: entry.note || "",
    });
    setIsEditModalOpen(true);
  };

  // Submit the edit form
  const handleUpdateStockEntry = async (e) => {
    e.preventDefault();

    if (
      !formData.productId ||
      !formData.supplierId ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !formData.batchNumber
    ) {
      return toast.error("All required fields must be filled");
    }

    try {
      const response = await axios.put(
        `${baseUrl}/api/entryStock/${currentEditId}`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Stock entry updated successfully");
        setIsEditModalOpen(false);
        resetFormData();
        fetchStockEntries();
        fetchProducts();
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // Reset form data to initial state
  const resetFormData = () => {
    setFormData({
      productId: "",
      supplierId: "",
      quantity: "",
      purchasePrice: "",
      expiryDate: "",
      batchNumber: "",
      note: "",
    });
    setCurrentEditId(null);
  };

  // Close modal and reset form data
  const closeModal = () => {
    setStockEntryModal(false);
    setIsEditModalOpen(false);
    resetFormData();
  };

  // Get product name by ID
  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "Unknown Product";
  };

  // Get supplier name by ID
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  return (
    <>
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
        {/* Empty div for spacing */}
        <div className="flex justify-end items-center pb-2"></div>

        {/* Stock Entry Modal */}
        <Modal isOpen={isStockEntryModalOpen} onClose={closeModal}>
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Create New Stock Entry
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleCreateStockEntry}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity"
                    required
                    min="1"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter purchase price"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter batch number"
                    required
                  />
                </div>
              </div>

              {/* Note - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter any additional notes"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-5">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Add Stock Entry
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit Stock Entry Modal */}
        <Modal isOpen={isEditModalOpen} onClose={closeModal}>
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Edit Stock Entry
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleUpdateStockEntry}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity"
                    required
                    min="1"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter purchase price"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter batch number"
                    required
                  />
                </div>
              </div>

              {/* Note - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter any additional notes"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Update Stock Entry
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg flex-1 text-sm sm:text-base"
          />
          <input
            type="text"
            placeholder="Filter by batch number..."
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg text-sm sm:text-base"
          />
          <div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
              onClick={() => setIsModalOpen(true)}
            >
              Bulk Import CSV
            </button>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
                  <h2 className="text-lg font-semibold mb-4">
                    Upload CSV or Excel File
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      className="mb-4"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        onClick={() => {
                          setIsModalOpen(false);
                          setFile(null);
                          setMessage("");
                          setErrors([]);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Upload
                      </button>
                    </div>
                  </form>

                  {message && (
                    <p className="mt-3 text-sm text-green-600">{message}</p>
                  )}

                  {errors.length > 0 && (
                    <div className="mt-4 text-sm text-red-600 max-h-40 overflow-auto">
                      <strong>Errors:</strong>
                      <ul className="list-disc pl-5 mt-2">
                        {errors.map((err, i) => (
                          <li key={i}>
                            {err.reason} - {JSON.stringify(err.row)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
            onClick={() => setStockEntryModal(true)}
          >
            Add Stock Entry
          </button>
        </div>

        {/* Stock Entry Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Added Date
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Product
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Supplier
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Quantity
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Purchase Price
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Batch Number
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Expiry Date
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems?.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="p-3 text-sm sm:text-base">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {getProductName(entry.productId)}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {getSupplierName(entry.supplierId)}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {entry.quantity}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {entry.purchasePrice}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {entry.batchNumber}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {entry.expiryDate
                        ? new Date(entry.expiryDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      <button
                        onClick={() => handleEditClick(entry)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {currentItems?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-3 text-center text-gray-500">
                      No stock entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
            disabled={indexOfLastItem >= filteredStockEntries?.length}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer text-sm sm:text-base"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default StockEntryManagement;