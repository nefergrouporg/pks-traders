import React, { useRef, useEffect } from "react";
import {
  Printer as ESCPrinter,
  Text,
  Line,
  Cut,
  render as renderESC,
} from "react-thermal-printer";

import Receipt from "./Receipt";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { thermalPrinterService } from "../../../utils/ThermalPrinterService";

// Improved CSS for thermal receipt styling - optimized for less blank space
const THERMAL_RECEIPT_STYLES = `
  @media print {
  body * {
    visibility: hidden;
  }

  .receipt-content,
  .receipt-content * {
    visibility: visible;
  }

  .receipt-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm !important;
    padding: 0 !important;
    margin: 0 !important;
    font-family: 'Courier New', monospace !important;
    font-size: 10px !important;
    line-height: 1 !important;
  }

  @page {
    size: 80mm auto;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Remove all spacing */
  * {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
  }

  /* Force monospace font for alignment */
  p, div, span {
    font-family: 'Courier New', monospace !important;
    font-size: 10px !important;
  }

  /* Hide non-essential elements */
  button, .modal-buttons, .print-hidden {
    display: none !important;
  }

/* Preview styles */
.receipt-container {
  width: 80mm;
  margin: 0 auto;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1;
  padding: 0;
}

.receipt-container * {
  margin: 0;
  padding: 0;
  line-height: 1;
}

.receipt-content p,
.receipt-content div {
  font-family: 'Courier New', monospace !important;
  white-space: pre;
}
}

`;

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
  const printStylesRef = useRef<HTMLStyleElement | null>(null);

  // Add print-specific styles when component mounts
  useEffect(() => {
    // Create a style element for print media
    const styleElement = document.createElement("style");
    styleElement.type = "text/css";

    // Use the predefined styles for thermal receipts
    styleElement.appendChild(document.createTextNode(THERMAL_RECEIPT_STYLES));
    document.head.appendChild(styleElement);
    printStylesRef.current = styleElement;

    // Clean up when component unmounts
    return () => {
      if (printStylesRef.current) {
        document.head.removeChild(printStylesRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Optimized browser printing function for thermal printers
  const handleBrowserPrint = () => {
    if (!receiptRef.current) return;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;

    if (frameDoc) {
      frameDoc.open();

      // Clone the receipt content to modify for printing
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;

      // Apply print-specific styles directly
      receiptClone.style.width = "80mm";
      receiptClone.style.margin = "0";
      receiptClone.style.padding = "0";
      receiptClone.style.fontFamily = "'Courier New', monospace";
      receiptClone.style.fontSize = "10px";
      receiptClone.style.lineHeight = "1";

      // Remove any elements that shouldn't print
      const buttons = receiptClone.querySelectorAll("button");
      buttons.forEach((btn) => btn.remove());

      frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${saleId}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              font-family: 'Courier New', monospace !important;
              font-size: 10px !important;
              line-height: 1 !important;
            }
            * {
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
            }
          </style>
        </head>
        <body>
          ${receiptClone.outerHTML}
        </body>
      </html>
    `);

      frameDoc.close();

      printFrame.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 500);
        }, 300);
      };
    }
  };

  // Improved PDF function with correct dimensions for thermal printer
  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Create a temporary hidden container
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "80mm";
      tempDiv.style.fontFamily = "'Courier New', monospace";
      tempDiv.style.fontSize = "10px";
      tempDiv.style.lineHeight = "1";
      tempDiv.style.backgroundColor = "#fff";
      tempDiv.style.padding = "0";
      tempDiv.style.margin = "0";

      document.body.appendChild(tempDiv);

      // Clone receipt content
      const clonedContent = receiptRef.current.cloneNode(true) as HTMLElement;
      clonedContent.style.width = "100%";
      clonedContent.style.margin = "0";
      clonedContent.style.padding = "0";
      clonedContent.style.overflow = "visible";
      clonedContent.style.maxHeight = "none"; // prevent clipping

      // Remove buttons or interactive elements
      const buttons = clonedContent.querySelectorAll("button");
      buttons.forEach((btn) => btn.remove());

      tempDiv.appendChild(clonedContent);

      // Wait for layout/paint
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use html2canvas on the full hidden DOM (not visible screen)
      const canvas = await html2canvas(clonedContent, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Calculate PDF size
      const canvasDataURL = canvas.toDataURL("image/png");
      const imgProps = {
        width: canvas.width,
        height: canvas.height,
      };
      const pdfWidth = 80; // mm for 80mm printer
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(canvasDataURL, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${customer?.name || "Receipt"}-${saleId}.pdf`);
      toast.success("Receipt downloaded as PDF");
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  // Optimized thermal printing function
  const handleThermalPrint = async () => {
    try {
      // Prepare receipt data for the thermal printer service
      const receiptData = {
        cart,
        totalPrice,
        saleId,
        paymentMethod,
        customer,
        saleType,
        customTotalPrice,
      };

      // Use the thermal printer service to print
      const result = await thermalPrinterService.printReceipt(receiptData);

      if (result.includes("success")) {
        toast.success("Receipt sent to thermal printer");
      } else {
        throw new Error(result);
      }
    } catch (error) {
      console.error("Thermal printing failed:", error);

      // Try direct Web Serial API as fallback
      try {
        if (navigator && "serial" in navigator && (navigator as any).serial) {
          // Configure for thermal printer width
          const columnWidth = 42; // Standard for many thermal printers

          const receiptTree = (
            <ESCPrinter
              type="epson"
              width={columnWidth}
              characterSet="slovenia"
            >
              {/* Initialize printer with compact settings */}
              <Text align="center" bold size={{ width: 1, height: 1 }}>
                PKS TRADERS
              </Text>
              <Line />
              <Text align="center">Bill No: {saleId}</Text>
              <Text align="center">{new Date().toLocaleDateString()}</Text>
              <Line />

              {/* Compact item display */}
              {cart.map((item, idx) => {
                const name =
                  item.name.length > columnWidth - 16
                    ? item.name.substring(0, columnWidth - 19) + "..."
                    : item.name;

                return (
                  <Text key={idx}>
                    {name.padEnd(columnWidth - 15)} {item.quantity}x
                    {item.price?.toFixed(2)}=
                    {(item.quantity * item.price).toFixed(2)}
                  </Text>
                );
              })}

              <Line />
              <Text align="right" bold>
                TOTAL: {(customTotalPrice ?? totalPrice).toFixed(2)}
              </Text>
              <Text>Paid via: {paymentMethod}</Text>
              <Text align="center">Thank you!</Text>

              {/* Cut immediately after content */}
              <Cut />
            </ESCPrinter>
          );

          const escposData = await renderESC(receiptTree);

          const port = await (navigator as any).serial.requestPort();
          await port.open({ baudRate: 9600 });
          const writer = port.writable?.getWriter();

          if (writer) {
            await writer.write(escposData);
            writer.releaseLock();
            await port.close();
            toast.success("Receipt printed successfully");
          }
        } else {
          toast.error("Web Serial API not supported in this browser");
        }
      } catch (serialError) {
        toast.error("Thermal printing failed. Check if printer is connected.");
      }
    }
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

        {/* Receipt content with specific class for styling */}
        <div
          ref={receiptRef}
          className="receipt-content border rounded-lg p-2 mb-4 max-h-[70vh] overflow-y-auto"
          style={{
            width: "80mm",
            margin: "0 auto",
            fontSize: "10px",
            lineHeight: "1.1",
          }}
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
            onClick={() => {
              downloadReceiptAsPDF();
              setTimeout(handleThermalPrint, 300);
            }}
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
