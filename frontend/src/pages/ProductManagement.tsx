import React, { useState } from 'react';

// Reusable Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="float-right text-gray-500 hover:text-gray-700">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// Product Management Page
const ProductManagement: React.FC = () => {
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [batchNumber, setBatchNumber] = useState('');

  // Dummy product data
  const products = [
    { id: 1, name: 'Product A', category: 'Electronics', stock: 10, supplier: 'Supplier X' },
    { id: 2, name: 'Product B', category: 'Clothing', stock: 5, supplier: 'Supplier Y' },
    { id: 3, name: 'Product C', category: 'Electronics', stock: 2, supplier: 'Supplier Z' },
  ];

  // Filter products based on search and category
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (categoryFilter ? product.category === categoryFilter : true)
  );

  // Generate batch number
  const generateBatchNumber = () => {
    const newBatchNumber = `BATCH-${Math.floor(Math.random() * 10000)}`;
    setBatchNumber(newBatchNumber);
  };

  // Handle image upload
  const handleImageUpload = (files: FileList | null) => {
    if (files && files[0]) {
      setUploadedImage(files[0]);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      {/* Search and Filter */}
      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-lg flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">{product.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Import CSV */}
      <div className="mb-6">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          Bulk Import CSV
        </button>
      </div>

      {/* Barcode Preview Modal */}
      <button
        onClick={() => setIsBarcodeModalOpen(true)}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition mb-6"
      >
        Preview Barcode
      </button>
      <Modal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)}>
        <h2 className="text-lg font-semibold mb-4">Barcode Preview</h2>
        <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Barcode Placeholder</p>
        </div>
      </Modal>

      {/* Supplier Dropdown */}
      <div className="mb-6">
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Select Supplier</option>
          <option value="Supplier X">Supplier X</option>
          <option value="Supplier Y">Supplier Y</option>
          <option value="Supplier Z">Supplier Z</option>
        </select>
      </div>

      {/* Drag-and-Drop Image Upload */}
      <div className="mb-6">
        <div
          className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImageUpload(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {uploadedImage ? (
              <p className="text-green-500">Uploaded: {uploadedImage.name}</p>
            ) : (
              <p className="text-gray-500">Drag and drop an image or click to upload</p>
            )}
          </label>
        </div>
      </div>

      {/* Batch Number Generator */}
      <div className="mb-6">
        <button
          onClick={generateBatchNumber}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
        >
          Generate Batch Number
        </button>
        {batchNumber && <p className="mt-2 text-gray-700">Batch Number: {batchNumber}</p>}
      </div>

      {/* Low Stock Threshold Alerts */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Low Stock Alerts</h2>
        <ul>
          {products
            .filter((product) => product.stock <= 5)
            .map((product) => (
              <li key={product.id} className="text-red-500">
                {product.name} (Stock: {product.stock})
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductManagement;