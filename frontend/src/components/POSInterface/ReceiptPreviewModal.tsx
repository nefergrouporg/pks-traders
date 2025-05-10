import React, { useRef } from "react";
import {
  Printer as ESCPrinter,
  Text,
  Row,
  Line,
  Cut,
  render as renderESC,
} from "react-thermal-printer";

import Receipt from "./Receipt";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify"; // Assuming you're using react-toastify, adjust if using another library
import { thermalPrinterService } from "../../../utils/ThermalPrinterService";

interface Navigator {
  serial: {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  };
}
interface SerialPort {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  // … add other methods/events as needed …
}
interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}
interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
}

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
  customer?: any;
  saleType: "retail" | "wholeSale";
  customTotalPrice?: number;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalPrice,
  saleId,
  paymentMethod,
  customer,
  saleType = "retail",
  customTotalPrice,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Function for browser printing
  const handleBrowserPrint = () => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Function for PDF download
  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.appendChild(receiptRef.current.cloneNode(true));
      document.body.appendChild(tempDiv);

      const element = tempDiv.firstChild as HTMLElement;

      element.style.width = "80mm";
      element.style.height = "auto";

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        width: 300,
        windowWidth: 300,
      });

      document.body.removeChild(tempDiv);

      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      pdf.save(`receipt-${saleId}.pdf`);
      toast.success("Receipt downloaded as PDF");
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try  again.");
    }
  };

  // Function for thermal printing
  const handleThermalPrint = async () => {
    try {
      const receiptTree = (
        <ESCPrinter type="epson" width={48} characterSet="slovenia">
          <Text align="center" bold size={{ width: 1, height: 1 }}>
            PKS TRADERS
          </Text>
          <Line />
          <Text>Bill No: {saleId}</Text>
          {/* … map your cart items to <Row> or <Text> … */}
          <Line />
          <Text align="right" bold>
            BILL AMOUNT: {(customTotalPrice ?? totalPrice).toFixed(2)}
          </Text>
          <Cut />
        </ESCPrinter>
      );
      const escposData: Uint8Array = await renderESC(receiptTree);

      const port = await navigator.serial.requestPort(); // ← prompt user to pick the USB printer
      await port.open({ baudRate: 9600 }); // ← open at your printer’s baud rate
      const writer = port.writable!.getWriter(); // ← grab a writer
      await writer.write(escposData); // ← send the bytes
      writer.releaseLock();

      toast.success("Receipt sent to thermal printer");
    } catch (error) {
      console.error("Thermal printing failed:", error);
      toast.error("Thermal printing failed. Check if printer is connected.");
    }
  };

  // Combined function for PDF and browser printing
  const handlePdfAndBrowserPrint = () => {
    downloadReceiptAsPDF();
    handleBrowserPrint();
  };

  // Combined function for all printing methods
  const handleAllPrinting = () => {
    downloadReceiptAsPDF();
    handleThermalPrint();
    handleBrowserPrint();
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
            customTotalPrice={customTotalPrice}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={downloadReceiptAsPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download PDF
          </button>
          <button
            onClick={handleBrowserPrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Browser Print
          </button>
          <button
            onClick={handleThermalPrint}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Thermal Print
          </button>
          <button
            onClick={handleAllPrinting}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Print All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
