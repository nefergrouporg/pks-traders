import React from "react";
import moment from "moment";

interface ReceiptProps {
  cart: Array<{
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    quantity: number;
    unitType: "pcs" | "kg";
    price: number; // Modified price (if any)
  }>;
  totalPrice: number;
  saleId: number;
  paymentMethod: string;
  customer?: any;
  saleType: "retail" | "wholeSale";
  customTotalPrice?: number;
}

const Receipt: React.FC<ReceiptProps> = ({
  cart,
  totalPrice,
  saleId,
  paymentMethod,
  customer,
  saleType = "retail",
  customTotalPrice,
}) => {
  // Get the price based on sale type for each item
  const originalSubtotal = cart.reduce((acc, item) => {
    const originalPrice =
      saleType === "wholeSale" && item.price ? item.price : item.retailPrice;
    return acc + originalPrice * item.quantity;
  }, 0);

  const displayTotal = customTotalPrice ?? totalPrice;

  return (
    <div className="min-w-[300px] max-w-[400px] mx-auto p-4 bg-white text-black">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">PKS Traders</h1>
      </div>

      <div className="flex justify-between mb-4">
        <div>
          <p>
            <strong>Invoice #:</strong> {saleId}
          </p>
          <p>
            <strong>Date:</strong> {moment().format("YYYY-MM-DD")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">
            {saleType === "wholeSale" ? "WHOLESALE INVOICE" : "RETAIL INVOICE"}
          </p>
        </div>
      </div>

      {customer && (
        <div className="mb-4 border-t border-b py-2">
          <p>
            <strong>Customer:</strong> {customer.name || "No Name"}
          </p>
          <p>
            <strong>Phone:</strong> {customer.phone}
          </p>
          {customer.address && (
            <p>
              <strong>Address:</strong> {customer.address}
            </p>
          )}
        </div>
      )}

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Rate</th>
            <th className="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => {
            const originalPrice =
              item.price !== undefined
                ? item.price
                : saleType === "wholeSale"
                ? item.wholeSalePrice ?? item.retailPrice
                : item.retailPrice;
            return (
              <tr key={item.id} className="border-b text-sm">
                <td className="py-1">{item.name}</td>
                <td className="text-center">
                  {item.quantity} {item.unitType}
                </td>
                <td className="text-right">₹{originalPrice.toFixed(2)}</td>
                <td className="text-right">
                  ₹{(originalPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {saleType === "wholeSale" && (
        <div className="mb-2 text-sm">
          <div className="flex justify-between">
            <span>Calculated Total:</span>
            <span>₹{originalSubtotal.toFixed(2)}</span>
          </div>
          {customTotalPrice !== undefined && (
            <div className="flex justify-between text-green-700">
              <span>Negotiated Price:</span>
              <span>₹{customTotalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between font-bold border-t pt-2 mb-4">
        <div>Total</div>
        <div>₹{displayTotal.toFixed(2)}</div>
      </div>

      <div className="flex justify-between border-t">
        <div>Payment Method</div>
        <div className="uppercase">{paymentMethod}</div>
      </div>
    </div>
  );
};

export default Receipt;
