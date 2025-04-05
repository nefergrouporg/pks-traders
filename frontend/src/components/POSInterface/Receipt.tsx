import React from "react";

interface ReceiptProps {
  cart: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    unitType: "pcs" | "kg";
  }>;
  totalPrice: number;
  saleId: number;
  paymentMethod: string;
  customer?: any;
}

const Receipt: React.FC<ReceiptProps> = ({ 
  cart, 
  totalPrice, 
  saleId, 
  paymentMethod, 
  customer 
}) => {
  const currentDate = new Date().toLocaleString();

  return (
    <div
      className="p-4"
      style={{ 
        width: "80mm", 
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        lineHeight: "1.2",
        padding: "2mm",
        background: "white !important",
        color: "black !important"
      }}
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">PKS store</h2>
        <p></p>
        <p></p>
        {/* <p>123 Store Address</p>
        <p>Phone: 123-456-7890</p> */}
        <p>--------------------------------</p>
        <p>RECEIPT</p>
        <p>--------------------------------</p>
        <p>Date: {currentDate}</p>
        <p>Sale ID: {saleId}</p>
        <p>Payment: {paymentMethod.toUpperCase()}</p>
        {customer && customer.name && <p>Customer: {customer.name}</p>}
        {customer && customer.phone && <p>Phone: {customer.phone}</p>}
        <p>--------------------------------</p>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="font-bold">Item</span>
          <span className="font-bold">Qty</span>
          <span className="font-bold">Price</span>
          <span className="font-bold">Total</span>
        </div>

        {cart.map((item) => (
          <div key={item.id} className="flex justify-between mb-1">
            <span>{item.name.substring(0, 12)}</span>
            <span>
              {item.quantity} {item.unitType}
            </span>
            <span>₹{item.price.toFixed(2)}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}

        <p>--------------------------------</p>
        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>₹{totalPrice.toFixed(2)}</span>
        </div>
        <p>--------------------------------</p>
        <p className="text-center mt-4">Thank you for shopping with us!</p>
      </div>
    </div>
  );
};

export default Receipt;