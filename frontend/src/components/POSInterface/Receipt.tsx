import React from "react";
import moment from 'moment';

interface ReceiptProps {
  cart: Array<{
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    quantity: number;
    unitType: "pcs" | "kg";
  }>;
  totalPrice: number;
  saleId: number;
  paymentMethod: string;
  customer?: any;
  saleType: "retail" | "wholeSale";
}

const Receipt: React.FC<ReceiptProps> = ({
  cart,
  totalPrice,
  saleId,
  paymentMethod,
  customer,
  saleType = "retail",
}) => {
  // Get the price based on sale type for each item
  const getItemPrice = (item) => {
    return saleType === "wholeSale" && item.wholeSalePrice 
      ? item.wholeSalePrice 
      : item.retailPrice;
  };

  return (
    <div className="min-w-[300px] max-w-[400px] mx-auto p-4 bg-white text-black">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">PKS Traders</h1>
        <p className="text-sm">Phone: +91 1234567890</p>
      </div>
      
      <div className="flex justify-between mb-4">
        <div>
          <p><strong>Invoice #:</strong> {saleId}</p>
          <p><strong>Date:</strong> {moment().format('YYYY-MM-DD')}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">
            {saleType === "wholeSale" ? "WHOLESALE INVOICE" : "RETAIL INVOICE"}
          </p>
        </div>
      </div>

      {customer && (
        <div className="mb-4 border-t border-b py-2">
          <p><strong>Customer:</strong> {customer.name || "No Name"}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
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
            const price = getItemPrice(item);
            return (
              <tr key={item.id} className="border-b text-sm">
                <td className="py-1">{item.name}</td>
                <td className="text-center">{item.quantity} {item.unitType}</td>
                <td className="text-right">₹{price.toFixed(2)}</td>
                <td className="text-right">₹{(price * item.quantity).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between font-bold border-t pt-2 mb-4">
        <div>Total</div>
        <div>₹{totalPrice.toFixed(2)}</div>
      </div>

      <div className="flex justify-between border-t pt-2 mb-4">
        <div>Payment Method</div>
        <div className="uppercase">{paymentMethod}</div>
      </div>

      <div className="text-center text-sm mt-6">
        <p>Thank you for your business!</p>
        <p>Visit us again soon.</p>
      </div>
    </div>
  );
};

export default Receipt;