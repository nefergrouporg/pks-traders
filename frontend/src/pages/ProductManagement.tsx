import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  batchNumber: string;
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Confirm {action}</h2>
        <p className="mb-6">{actionMessage}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${
              currentStatus ? "bg-red-500" : "bg-green-500"
            } text-white px-4 py-2 rounded-lg hover:${
              currentStatus ? "bg-red-600" : "bg-green-600"
            } transition`}
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
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isProductModalOpen, setProductModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    category: "",
    batchNumber: "",
    lowStockThreshold: "",
    stock: "",
    supplierName: "",
    unitType: "",
    description: "",
  });

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get<{ products: Product[] }>(
        `${baseUrl}/api/products`
      );
      setProducts(response.data.products);
    };
    fetchProducts();
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

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    if (
      (!formData.name ||
        !formData.price ||
        !formData.stock ||
        !formData.supplierName ||
        !formData.batchNumber ||
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
        const fetchResponse = await axios.get(`${baseUrl}/api/products`);
        setProducts(fetchResponse.data.products);
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
      price: "",
      category: "",
      batchNumber: "",
      lowStockThreshold: "",
      stock: "",
      supplierName: "",
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
      price: product.price,
      category: product.category,
      batchNumber: product.batchNumber,
      lowStockThreshold: product.lowStockThreshold,
      stock: product.stock,
      supplierName: product.supplierName,
      unitType: product.unitType,
      description: product.description,
    });
    setIsEditing(true); // Set editing mode
    setProductModal(true); // Open modal
  };

  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-end items-center pb-2"></div>

        <Modal isOpen={isProductModalOpen} onClose={closeModal}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {isEditing ? "Update Product" : "Create New Product"}
            </h2>

            <form className="space-y-4" onSubmit={handleCreateProduct}>
              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    list="productNames"
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter price"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select category</option>
                    <option value="fruits">Fruits</option>
                    <option value="vegetables">Vegetables</option>
                  </select>
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    name="batchNumber"
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter batch number"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter threshold quantity"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    name="stock"
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter stock quantity"
                  />
                </div>

                {/* Supplier ID */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Supplier
                  </label>
                  <select
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.supplierName}
                    name="supplierName"
                    onChange={handleInputChange}
                  >
                    <option value="">Select supplier</option>
                    {suppliers?.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unit Type
                  </label>
                  <select
                    className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.unitType}
                    name="unitType"
                    onChange={handleInputChange}
                  >
                    <option value="">Select unit type</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                {isEditing ? (
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                  >
                    Update Product
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                  >
                    Create Product
                  </button>
                )}
              </div>
            </form>
          </div>
        </Modal>

        {/* Search and Filter */}
        <div className="mb-6 flex space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg flex-1"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-gray-400 bg-transparent rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
          </select>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            onClick={() => setProductModal(true)}
          >
            Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Batch</th>
                <th className="p-3 text-left">Actions</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems?.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.category}</td>
                  <td className="p-3">{product.stock}</td>
                  <td className="p-3">{product.batchNumber}</td>
                  <td>
                    <button
                      onClick={() => handleEditClick(product)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                    >
                      Edit
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

        <div className="flex justify-center mt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="mx-2 px-4 py-2 bg-gray-300 rounded-lg text-lg font-medium cursor-pointer">
            {currentPage}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastItem >= filteredProducts?.length}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>

        {/* Bulk Import CSV */}
        <div className="mb-6">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
            Bulk Import CSV
          </button>
        </div>

        {/* Low Stock Threshold Alerts */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Low Stock Alerts</h2>
          <ul>
            {products
              ?.filter((product) => product.stock <= product.lowStockThreshold)
              ?.map((product) => (
                <li key={product.id} className="text-red-500">
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
