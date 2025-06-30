import React from "react";
import moment from "moment";

// Define Payment interface
interface Payment {
  method: "cash" | "card" | "upi" | "debt";
  amount: number;
  status?: "pending" | "completed" | "failed";
  qr?: string;
  id?: number;
}

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
  payments: Payment[];
  customer?: {
    id: number;
    name: string | null;
    debtAmount: string | number;
  } | null
  saleType: "retail" | "wholeSale" | "hotel"; // Updated to include "hotel"
  customTotalPrice?: number;
  saleDate: string;
  branch: {
    name: string;
    address: string;
    phone: string;
  }
}

const Receipt: React.FC<ReceiptProps> = ({
  cart,
  totalPrice,
  saleId,
  payments,
  customer,
  saleType = "retail",
  customTotalPrice,
  saleDate,
  branch
}) => {
  // Use totalPrice as the bill amount (customTotalPrice is optional for adjustments)
  const billAmount = customTotalPrice ?? totalPrice;

  // Calculate previous debt
  const previousDebt = customer
    ? parseFloat((customer.debtAmount as string) || "0")
    : 0;

  // Calculate received amount (sum of non-debt payments)
  const received = (payments || [])
    .filter((p) => p.method !== "debt")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const debtAdded = (payments || [])
    .filter((p) => p.method === "debt")
    .reduce((sum, p) => sum + parseFloat(p.amount.toString() || "0"), 0);

  // Calculate unpaid amount (if received is less than bill amount)
  const unpaid = Math.max(0, billAmount - received);

  // Calculate updated debt
  const updatedDebt = previousDebt + billAmount - received;

  // Calculate net amount (total amount to be paid including debt)
  const netAmount = previousDebt + billAmount;

  return (
    <div className="min-w-[300px] max-w-[400px] mx-auto p-4 bg-white text-black font-mono">
      {/* Store name and header */}
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold tracking-wider">{branch.name}</h1>
        <div className="text-xs">
          <div>{branch.address}</div>
          <div>{branch.phone}</div>
          <div className="border-t border-b border-dashed my-1 py-1">
            <p>Bill No: {saleId}</p>
            <p>Date: {moment(saleDate).format("DD/MM/YYYY")}</p>
            {customer && <p>To: {customer.name || "No Name"}</p>}
          </div>
        </div>
      </div>

      {/* Item header */}
      <div className="text-xs border-b border-dashed flex mb-1">
        <div className="w-8 text-left">NO</div>
        <div className="flex-1 text-left">ITEM NAME</div>
        <div className="w-12 text-right">QTY</div>
        {saleType !== "hotel" && <div className="w-16 text-right">RATE</div>}
        <div className="w-20 text-right">TOTAL</div>
      </div>

      {/* Cart items */}
      <div className="text-xs mb-2">
        {cart.map((item, index) => {
          const price = item.price; // Use the price from the cart item
          return (
            <div key={item.id} className="flex py-1">
              <div className="w-8 text-left">{index + 1}</div>
              <div className="flex-1 text-left uppercase">
                {item.name.length > 20
                  ? `${item.name.substring(0, 20)}\n${item.name.substring(20)}`
                  : item.name}
              </div>
              <div className="w-12 text-right">{item.quantity}</div>
              {saleType !== "hotel" && (
                <div className="w-16 text-right">{price.toFixed(2)}</div>
              )}
              <div className="w-20 text-right">
                {(price * item.quantity).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total amount section */}
      <div className="border-t border-dashed pt-2 mb-1">
        <div className="flex justify-between text-lg font-bold">
          <div>BILL AMOUNT :</div>
          <div>{billAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Payment and balance information */}
      <div className="text-xs">
        {customer && (
          <>
            <div className="flex justify-between">
              <span>PREVIOUS:</span>
              <span>{previousDebt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>NET AMOUNT:</span>
              <span>{netAmount.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span>REC AMOUNT:</span>
          <span>{received.toFixed(2)}</span>
        </div>
        {customer && (
          <div className="flex justify-between">
            <span>BALANCE:</span>
            <span>{updatedDebt.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-xs border-t border-dashed mt-4 pt-1">
        <div>Time: {moment().format("HH:mm:ss")}</div>
      </div>
    </div>
  );
};

export default Receipt;
