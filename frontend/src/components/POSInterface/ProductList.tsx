import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRefresh,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const ProductList: React.FC<{
  products: Array<{ id: number; name: string; stock: number; price: number; unitType: "pcs" | "kg";}>;
  onAddToCart: (product: { id: number; name: string; price: number; unitType: "pcs" | "kg";}) => void;
  onRefresh: () => Promise<void>; // Ensure the refresh function supports async
  isLoading: boolean;
}> = ({ products, onAddToCart, onRefresh, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-lg border bg-white shadow-md p-4 w-full h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Available Products</h2>
        <button
          onClick={onRefresh}
          className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="w-5 h-5 text-gray-500"
            />
          ) : (
            <FontAwesomeIcon icon={faRefresh} className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-2.5 text-gray-400 w-5 h-5"
        />
        <input
          type="text"
          placeholder="Search products..."
          className="pl-10 pr-4 py-2 w-full border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Product List with Scrollable UI */}
      <div className="space-y-2 h-40 overflow-y-auto border rounded p-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
              onClick={() => onAddToCart(product)}
            >
              <p className="w-32">{product.name}</p>
              <p className="text-end">{product.unitType === "kg" ? product.stock?.toFixed(2) : product.stock} {product.unitType === "kg" ? "kg" : "pcs"}</p>
              <p className="w-20 text-right font-semibold">
                ₹{product.price.toFixed(2)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
