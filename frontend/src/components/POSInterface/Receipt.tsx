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
    <div className="min-w-[300px] max-w-[400px] mx-auto p-4 bg-white text-black font-mono">
      {/* Store name and header */}
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold tracking-wider">PKS TRADERS</h1>
        <div className="text-xs">
          {/* <p>GSTIN: 32CEUPM084GN1ZX PH: 9847359760</p> */}
          <div className="border-t border-b border-dashed my-1 py-1">
            <p>Bill No:{saleId}</p>
            <p>Date:{moment().format("DD/MM/YYYY")}</p>
            {customer && <p>To : {customer.name || "No Name"}</p>}
          </div>
        </div>
      </div>

      {/* Item header */}
      <div className="text-xs border-b border-dashed flex mb-1">
        <div className="w-8 text-left">NO</div>
        <div className="flex-1 text-left">ITEM NAME</div>
        <div className="w-12 text-right">QTY</div>
        <div className="w-16 text-right">RATE</div>
        <div className="w-20 text-right">TOTAL</div>
      </div>

      {/* Cart items */}
      <div className="text-xs mb-2">
        {cart.map((item, index) => {
          const originalPrice =
            item.price !== undefined
              ? item.price
              : saleType === "wholeSale"
              ? item.wholeSalePrice ?? item.retailPrice
              : item.retailPrice;
          
          // Format the item name to wrap if needed
          const formattedName = item.name.length > 20
            ? `${item.name.substring(0, 20)}\n${item.name.substring(20)}`
            : item.name;
            
          return (
            <div key={item.id} className="flex py-1">
              <div className="w-8 text-left">{index + 1}</div>
              <div className="flex-1 text-left uppercase">{formattedName}</div>
              <div className="w-12 text-right">{item.quantity}</div>
              <div className="w-16 text-right">{originalPrice.toFixed(2)}</div>
              <div className="w-20 text-right">
                {(originalPrice * item.quantity).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total amount section */}
      <div className="border-t border-dashed pt-2 mb-1">
        <div className="flex justify-between text-lg font-bold">
          <div>BILL AMOUNT :</div>
          <div>{displayTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Payment and balance information */}
      <div className="text-xs">
        {saleType === "wholeSale" && (
          <>
            <div className="flex justify-between">
              <span>Previous :</span>
              <span>{originalSubtotal.toFixed(2)}</span>
            </div>
            {customTotalPrice !== undefined && (
              <div className="flex justify-between">
                <span>Net Amount:</span>
                <span>{customTotalPrice.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between">
          <span>Debt Amount:</span>
          <span>{customer ? customer.debtAmount : "0.00"}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid :</span>
          <span>{displayTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Time */}
      <div className="text-xs border-t border-dashed mt-4 pt-1">
        <div>Time : {moment().format("HH:mm:ss")}</div>
      </div>
    </div>
  );
};

export default Receipt;