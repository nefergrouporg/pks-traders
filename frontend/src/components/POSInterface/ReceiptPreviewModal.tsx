import React, { useRef } from "react";
import Receipt from "./Receipt";

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Array<{
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    quantity: number;
    unitType: "pcs" | "kg";
    price: number;
  }>;
  totalPrice: number;
  saleId: number;
  paymentMethod: string;
  onPrint: () => void;
  onDownload: () => void;
  customer?: any;
  handleAutomaticPrintAndDownload?: () => void;
  saleType: "retail" | "wholeSale";
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalPrice,
  saleId,
  paymentMethod,
  onPrint,
  onDownload,
  customer,
  handleAutomaticPrintAndDownload,
  saleType = "retail", // Default to retail
}) => {
  console.log('preview', cart)
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    onDownload(); // Always download first
    onPrint();
  };

  const handleDownloadAndClose = () => {
    onDownload();
    // onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Receipt Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div
          ref={receiptRef}
          className="border rounded-lg p-4 mb-4 max-h-[70vh] overflow-y-auto"
        >
          <Receipt
            cart={cart}
            totalPrice={totalPrice}
            saleId={saleId}
            paymentMethod={paymentMethod}
            customer={customer}
            saleType={saleType}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleDownloadAndClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
