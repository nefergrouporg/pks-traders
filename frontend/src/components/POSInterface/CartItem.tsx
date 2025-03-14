import React from "react";

const CartItem: React.FC<{
  item: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  };
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
}> = ({ item, onIncrease, onDecrease, onRemove }) => (
  <li className="flex justify-between items-center p-2 border-b last:border-b-0">
    <div className="flex-1">
      <p className="font-medium">{item.name}</p>
      <div className="flex items-center space-x-2 mt-1">
        <button
          onClick={() => onDecrease(item.id)}
          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          -
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => onIncrease(item.id)}
          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          +
        </button>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  </li>
);

export default CartItem;