import React from "react";

const ProductList: React.FC<{
  products: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  onAddToCart: (product: { id: number; name: string; price: number }) => void;
}> = ({ products, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-md p-4 h-full">
    <h2 className="text-xl font-bold mb-4">Available Products</h2>
    <div className="space-y-2">
      {products?.map(product => (
        <div
          key={product.id}
          className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
          onClick={() => onAddToCart(product)}
        >
          <p>{product.name}</p>
          <p className="font-semibold">${product.price.toFixed(2)}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ProductList;