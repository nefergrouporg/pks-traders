import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal";
import DeleteConfirmationModal from "../components/Dashboard/DeleteConfirmationModal";
import { set } from "../../../backend/app";

interface Product {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice: number;
  category: string;
  stock: number;
  barcode: string;
  description: string;
  lowStockThreshold: number;
  supplierId: number;
  active: boolean;
  isDeleted: boolean;
}

interface UploadError {
  reason: string;
  row: any;
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
  const action = currentStatus ? "Block" : "Unblock"; // Determine the action
  const actionMessage =
    message || `Are you sure you want to ${action.toLowerCase()} this item?`;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto"
    >
      {/* Modal Content Container */}
      <div className="p-4 sm:p-6">
        {/* Modal Title */}
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Confirm {action}
        </h2>

        {/* Modal Message */}
        <p className="mb-6 text-sm sm:text-base">{actionMessage}</p>

        {/* Action Buttons */}
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

// Product Management Page
const ProductManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isProductModalOpen, setProductModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    retailPrice: "",
    wholeSalePrice: "",
    category: "",
    barcode: "",
    lowStockThreshold: "",
    unitType: "",
    description: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(
    null
  );
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [isEditing, setIsEditing] = useState(false);
  const token = localStorage.getItem("token");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<UploadError[]>([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setErrors([]);
  };

  const fetchProducts = async () => {
    const response = await axios.get<{ products: Product[] }>(
      `${baseUrl}/api/products`
    );
    setProducts(response.data.products.filter((product) => !product.isDeleted));
  };

  const fetchSuppliers = async () => {
    const response = await axios.get(`${baseUrl}/api/supplier`);
    setSuppliers(response.data.suppliers);
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (categoryFilter ? product.category === categoryFilter : true)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["price", "lowStockThreshold", "stock"];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${baseUrl}/api/products/bulk-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message || "Upload successful");
        fetchProducts();
        setIsModalOpen(false);
      } else {
        toast.error(res.data.message || "Upload failed");
      }
      setErrors(res.data.errors || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      setFormData({ ...formData, barcode: e.target.value });
    }
  };

  const handleDelete = async () => {
    if (!productToDeleteId) return;

    try {
      const response = await axios.delete(
        `${baseUrl}/api/products/${productToDeleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDeleteId(null);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    if (
      (!formData.name ||
        !formData.retailPrice ||
        !formData.wholeSalePrice ||
        !formData.category ||
        !formData.lowStockThreshold ||
        !formData.unitType) &&
      !isEditing
    ) {
      return toast.error("All fields are Required");
    }
    try {
      const url = isEditing
        ? `${baseUrl}/api/products/${formData.id}`
        : `${baseUrl}/api/products`;

      const method = isEditing ? "put" : "post";
      const response = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 201 || response.status === 200) {
        toast.success(
          isEditing
            ? "Product updated successfully"
            : "Product created successfully"
        );
        setProductModal(false);
        resetFormData();
        setIsEditing(false);

        // Refresh product list
        fetchProducts();
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleToggle = async () => {
    if (!productToDelete) return;

    try {
      const response = await axios.put(
        `${baseUrl}/api/products/${productToDelete}/toggle-product`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success(
          response.data.message || "Product status toggled successfully"
        );

        // Update the local state to reflect the change
        setProducts((prevProducts) =>
          prevProducts?.map((product) =>
            product.id.toString() === productToDelete
              ? { ...product, active: !product.active }
              : product
          )
        );
      } else {
        toast.error(
          response.data.message ||
            "There was a problem toggling the product status"
        );
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
      toast.error("Failed to toggle product status");
    } finally {
      setIsConfirmationModalOpen(false); // Close the modal
      setProductToDelete(null);
    }
  };

  // Reset form data to initial state
  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      retailPrice: "",
      wholeSalePrice: "",
      category: "",
      barcode: "",
      lowStockThreshold: "",
      unitType: "",
      description: "",
    });
  };

  // Close modal and reset form data
  const closeModal = () => {
    setProductModal(false);
    resetFormData();
    setIsEditing(false);
  };

  const handleEditClick = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      wholeSalePrice: product.wholeSalePrice,
      category: product.category,
      barcode: product.barcode,
      lowStockThreshold: product.lowStockThreshold,
      unitType: product.unitType,
      description: product.description,
    });
    setIsEditing(true); // Set editing mode
    setProductModal(true); // Open modal
  };

  return (
    <>
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
        {/* Empty div for spacing */}
        <div className="flex justify-end items-center pb-2"></div>

        {/* Product Modal */}
        <Modal isOpen={isProductModalOpen} onClose={closeModal}>
          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? "Update Product" : "Create New Product"}
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleCreateProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    list="productNames"
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter product name"
                  />
                  <datalist id="productNames">
                    {[
                      ...new Set(products?.map((product) => product.name)),
                    ]?.map((name, index) => (
                      <option key={index} value={name} />
                    ))}
                  </datalist>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail Price
                  </label>
                  <input
                    type="number"
                    name="retailPrice"
                    value={formData.retailPrice}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Retail Price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WholeSale Price
                  </label>
                  <input
                    type="number"
                    name="wholeSalePrice"
                    value={formData.wholeSalePrice}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="WholeSale Price"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select category</option>
                    <option value="fruits">Fruits</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="grocery">Grocery</option>
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    onKeyDown={handleBarcodeScan}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Scan or enter barcode"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                    placeholder="Enter threshold quantity"
                  />
                </div>

                {/* Unit Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type
                  </label>
                  <select
                    name="unitType"
                    value={formData.unitType}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select unit type</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-5">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  {isEditing ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg flex-1 text-sm sm:text-base"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg text-sm sm:text-base"
          >
            <option value="">All Categories</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
          </select>
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
            onClick={() => setProductModal(true)}
          >
            Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm sm:text-base">Name</th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Category
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    WholeSale{" "}
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">Retail</th>
                  <th className="p-3 text-left text-sm sm:text-base">Stock</th>
                  <th className="p-3 text-left text-sm sm:text-base">
                    Actions
                  </th>
                  <th className="p-3 text-left text-sm sm:text-base">Delete</th>
                  <th className="p-3 text-left text-sm sm:text-base">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems?.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-3 text-sm sm:text-base">{product.name}</td>
                    <td className="p-3 text-sm sm:text-base">
                      {product.category}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {product.wholeSalePrice}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {product.retailPrice}
                    </td>
                    <td className="p-3 text-sm sm:text-base">
                      {product.stock}
                    </td>

                    <td>
                      <button
                        onClick={() => handleEditClick(product)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
                      >
                        Edit
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setProductToDeleteId(product.id.toString());
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm sm:text-base ml-2"
                      >
                        Delete
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setProductToDelete(product.id.toString()); // Set the product ID
                          setIsConfirmationModalOpen(true); // Open the confirmation modal
                        }}
                      >
                        <FontAwesomeIcon
                          icon={product.active ? faToggleOn : faToggleOff}
                          className={`text-2xl ${
                            product.active ? "text-green-500" : "text-red-900"
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

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => {
            setIsConfirmationModalOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={handleToggle}
          currentStatus={
            productToDelete
              ? products?.find((p) => p.id.toString() === productToDelete)
                  ?.active ?? false
              : false
          }
          message="Are you sure you want to proceed?"
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setProductToDeleteId(null);
          }}
          onConfirm={handleDelete}
          message="Are you sure you want to delete this product? This action cannot be undone."
        />

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
            disabled={indexOfLastItem >= filteredProducts?.length}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer text-sm sm:text-base"
          >
            Next
          </button>
        </div>

        {/* Low Stock Threshold Alerts */}
        <div className="bg-yellow-50 p-4 rounded-lg mt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Low Stock Alerts
          </h2>
          <ul>
            {products
              ?.filter((product) => product.stock <= product.lowStockThreshold)
              ?.map((product) => (
                <li
                  key={product.id}
                  className="text-red-500 text-sm sm:text-base"
                >
                  {product.name} (Stock: {product.stock})
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ProductManagement;
