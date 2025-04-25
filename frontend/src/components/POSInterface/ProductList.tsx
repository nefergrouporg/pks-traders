import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRefresh,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const ProductList: React.FC<{
  products: Array<{
    id: number;
    name: string;
    stock: number;
    retailPrice: number;
    wholeSalePrice?: number;
    unitType: "pcs" | "kg";
  }>;
  onAddToCart: (product: {
    id: number;
    name: string;
    retialPrice: number;
    wholeSalePrice?: number;
    unitType: "pcs" | "kg";
  }) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  saleType: "retail" | "wholeSale"; 
}> = ({ products, onAddToCart, onRefresh, isLoading, saleType }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Get the appropriate price based on sale type
  const getDisplayPrice = (product) => {
    if (saleType === "wholeSale") {
      return product?.wholeSalePrice;
    }else{
      return product?.retailPrice;
    }
  };

  return (
    <div className="rounded-lg border bg-white shadow-md p-4 w-full h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Available Products</h2>
        <button
          onClick={onRefresh}
          className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
            />
          ) : (
            <FontAwesomeIcon
              icon={faRefresh}
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 sm:w-5 sm:h-5"
        />
        <input
          type="text"
          placeholder="Search products..."
          className="pl-8 sm:pl-10 pr-4 py-2 w-full border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm sm:text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Product List with Scrollable UI */}
      <div className="h-40 overflow-y-auto border rounded p-2">
        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-2 mb-2 text-sm sm:text-base font-semibold">
          <p className="truncate">Product Name</p>
          <p className="text-center">Stock</p>
          <p className="text-right">Price ({saleType})</p>
        </div>

        {/* Product Items */}
        {filteredProducts.length > 0 ? (
          filteredProducts?.map((product) => (
            <div
              key={product?.id}
              className="grid grid-cols-3 gap-2 items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
              onClick={() => onAddToCart(product)}
            >
              <p className="truncate text-sm sm:text-base">{product.name}</p>
              <p className="text-center text-sm sm:text-base">
                {product.unitType === "kg"
                  ? product?.stock?.toFixed(2)
                  : product?.stock}{" "}
                {product?.unitType === "kg" ? "kg" : "pcs"}
              </p>
              <p className="text-right font-semibold text-sm sm:text-base">
                ₹{typeof getDisplayPrice(product) === 'number' 
                  ? getDisplayPrice(product)?.toFixed(2) 
                  : 'N/A'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center text-sm sm:text-base">
            No products found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductList;