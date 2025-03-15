import React from "react";

const CartItem: React.FC<{
  item: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    unitType: "pcs" | "kg";
  };
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateKg: (id: number, newQuantity: number) => void;
}> = ({ item, onIncrease, onDecrease, onRemove, onUpdateKg }) => (
  <tr className="border-b">
    {/* Product Name - Left Aligned */}
    <td className="p-3 text-left">{item.name}</td>

    {/* Price - Center Aligned */}
    <td className="p-3">₹{item.price.toFixed(2)}</td>

    {/* Quantity - Center Aligned */}
    <td className="p-3">
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => onDecrease(item.id)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          step={item.unitType === "kg" ? "0.1" : "1"}
          value={item.quantity.toString()} // Ensure no leading zeros in display
          onChange={(e) => {
            let value = e.target.value;

            // If input is empty, set it to "0"
            if (value === "") {
              value = "0";
            }

            // Remove leading zeros (except for single "0")
            if (value.length > 1 && value.startsWith("0")) {
              value = value.replace(/^0+/, "");
            }

            // Convert value based on unit type
            const parsedValue =
              item.unitType === "kg" ? parseFloat(value) : parseInt(value, 10);

            onUpdateKg(item.id, isNaN(parsedValue) ? 0 : parsedValue);
          }}
          className="w-16 text-center bg-white border rounded p-1"
        />

        <span className="text-gray-500">{item.unitType}</span>
        <button
          onClick={() => onIncrease(item.id)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          +
        </button>
      </div>
    </td>

    {/* Total Price - Center Aligned */}
    <td className="p-3 font-semibold">
      ₹{(item.price * item.quantity).toFixed(2)}
    </td>

    {/* Remove Button - Center Aligned */}
    <td className="p-3">
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        ✖
      </button>
    </td>
  </tr>
);

export default CartItem;
