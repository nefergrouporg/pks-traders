import React from "react";
import CartItem from "./CartItem";

interface CartItemType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unitType: "pcs" | "kg";
}

const ShoppingCart: React.FC<{
  cart: CartItemType[];
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateKg: (id: number, newQuantity: number) => void;
}> = ({ cart, onIncrease, onDecrease, onRemove, onUpdateKg }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h2 className="text-xl font-bold mb-4">Cart</h2>
    {cart.length === 0 ? (
      <p className="text-gray-500">Current cart is empty.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-center">
          <thead className="bg-gray-100">
            <tr className="border-b">
              <th className="p-3 w-1/5 text-left">Product</th>
              <th className="p-3 w-1/5">Price</th>
              <th className="p-3 w-1/5">Quantity</th>
              <th className="p-3 w-1/5">Total</th>
              <th className="p-3 w-1/5">Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
                onRemove={onRemove}
                onUpdateKg={onUpdateKg}
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default ShoppingCart;
