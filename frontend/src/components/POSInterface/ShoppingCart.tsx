import React from "react";
import CartItem from "./CartItem";

interface CartItemType {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const ShoppingCart: React.FC<{
  cart: CartItemType[];
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
}> = ({ cart, onIncrease, onDecrease, onRemove }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
    {cart.length === 0 ? (
      <p className="text-gray-500">Your cart is empty.</p>
    ) : (
      <ul className="space-y-2">
        {cart.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            onRemove={onRemove}
          />
        ))}
      </ul>
    )}
  </div>
);

export default ShoppingCart;