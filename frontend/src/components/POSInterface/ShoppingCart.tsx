import React, { useState, useEffect } from "react";
import CartItem from "./CartItem";

interface ShoppingCartProps {
  cart: Array<{
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    quantity: number;
    unitType: "pcs" | "kg";
  }>;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateKg: (id: number, newQuantity: number) => void;
  saleType: "retail" | "wholeSale";
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateKg,
  saleType,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => {
    const price =
      saleType === "wholeSale" && item.wholeSalePrice
        ? item.wholeSalePrice
        : item.retailPrice;
    return total + price * item.quantity;
  }, 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, cart.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (selectedIndex >= 0) {
      const item = cart[selectedIndex];
      switch (e.key) {
        case "+":
          onIncrease(item.id);
          break;
        case "-":
          onDecrease(item.id);
          break;
        case "d":
          onRemove(item.id);
          setSelectedIndex((prev) => (prev >= cart.length - 1 ? prev - 1 : prev));
          break;
      }
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 max-h-96 overflow-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Shopping Cart</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {saleType === "wholeSale" ? "Wholesale Pricing" : "Retail Pricing"}
        </span>
      </div>

      {cart.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Your cart is empty. Add products to get started.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-2 text-sm font-semibold border-b pb-2">
            <div className="col-span-1">Item</div>
            <div className="text-center">Price</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Total</div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y">
            {cart.map((item, index) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
                onRemove={onRemove}
                onUpdateKg={onUpdateKg}
                saleType={saleType}
                isSelected={index === selectedIndex}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold">₹{totalAmount.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            (Arrow keys to navigate, + to increase, - to decrease, D to remove)
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;