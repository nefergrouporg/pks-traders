import React from "react";

interface CartItemProps {
  item: {
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    quantity: number;
    unitType: "pcs" | "kg";
  };
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateKg: (id: number, newQuantity: number) => void;
  saleType: "retail" | "wholesale";
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateKg,
  saleType
}) => {
  // Get the correct price based on sale type
  const price = saleType === "wholesale" && item.wholeSalePrice 
    ? item.wholeSalePrice 
    : item.retailPrice;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    if (!isNaN(newQuantity)) {
      onUpdateKg(item.id, newQuantity);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 py-2 items-center">
      <div className="col-span-1 font-medium truncate">{item.name}</div>
      
      <div className="text-center">
        <div className="text-sm">₹{price.toFixed(2)}</div>
        <div className="text-xs text-gray-500">
          {saleType === "wholesale" ? "Wholesale" : "Retail"}
        </div>
      </div>
      
      <div className="text-center">
        {item.unitType === "pcs" ? (
          <div className="inline-flex rounded overflow-hidden">
            <button
              onClick={() => onDecrease(item.id)}
              className="bg-gray-200 px-2 rounded-l"
            >
              -
            </button>
            <span className="px-3 py-1 bg-gray-100">
              {item.quantity}
            </span>
            <button
              onClick={() => onIncrease(item.id)}
              className="bg-gray-200 px-2 rounded-r"
            >
              +
            </button>
          </div>
        ) : (
          <input
            type="number"
            min="0"
            step="0.1"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="w-16 text-center border rounded p-1"
          />
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-right font-bold">
          ₹{(price * item.quantity).toFixed(2)}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CartItem;