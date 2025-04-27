import React, { useState, useEffect, useRef, forwardRef } from "react";
import { baseUrl } from "../../../utils/services";

interface Product {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice?: number;
  barcode: string;
  stock: number;
  unitType: "pcs" | "kg";
}

interface ProductSearchProps {
  onAddToCart: (product: Product) => void;
  saleType: "retail" | "wholeSale";
}

const ProductSearch = forwardRef<HTMLInputElement, ProductSearchProps>(
  ({ onAddToCart, saleType }, ref) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await fetch(`${baseUrl}/api/products`);
          const data = await response.json();
          if (Array.isArray(data)) {
            setProducts(data);
          } else if (Array.isArray(data.products)) {
            setProducts(data.products);
          } else {
            console.error("Invalid products format:", data);
            setProducts([]);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
          setProducts([]);
        }
      };
      fetchProducts();
    }, []);

    useEffect(() => {
      if (searchTerm.trim()) {
        const filtered = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.includes(searchTerm)
        );
        setFilteredProducts(filtered);
        setIsDropdownOpen(true);
        setSelectedIndex(-1);
      } else {
        setFilteredProducts([]);
        setIsDropdownOpen(false);
      }
    }, [searchTerm, products]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectProduct(filteredProducts[selectedIndex]);
      }
    };

    const handleSelectProduct = (product: Product) => {
      onAddToCart(product);
      setSearchTerm("");
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    };

    return (
      <div className="relative">
        <input
          ref={(node) => {
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement>).current = node;
            inputRef.current = node;
          }}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products by name or barcode"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    index === selectedIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => handleSelectProduct(product)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSelectProduct(product);
                  }}
                >
                  <div className="flex justify-between">
                    <span>{product.name}</span>
                    <span>
                      ₹
                      {(saleType === "wholeSale" && product.wholeSalePrice
                        ? product.wholeSalePrice
                        : product.retailPrice
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock: {product.stock} {product.unitType}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default ProductSearch;