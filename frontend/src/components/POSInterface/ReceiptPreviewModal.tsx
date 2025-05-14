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

// Enhanced CSS for thermal receipt styling - optimized for printing
const THERMAL_RECEIPT_STYLES = `
  @media print {
    /* Reset and base styles */
    html, body {
      width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Courier New', monospace !important;
      font-size: 10px !important;
      line-height: 1.1 !important; /* Reduced line height for tighter spacing */
      background-color: white !important;
      color: black !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    * {
      box-sizing: border-box !important;
      margin: 0 !important; /* Explicitly reset margins */
      padding: 0 !important; /* Explicitly reset padding */
    }

    /* Hide all other content */
    body * {
      visibility: hidden;
      display: none;
    }

    /* Show only receipt content */
    .receipt-content,
    .receipt-content * {
      visibility: visible !important;
      display: block !important;
    }

    .receipt-content {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 80mm !important;
      padding: 2px !important; /* Reduced padding */
      margin: 0 !important;
      font-family: 'Courier New', monospace !important;
      font-size: 10px !important;
      line-height: 1.1 !important;
      color: black !important;
      background-color: white !important;
    }

    /* Force specific page size for thermal printers */
    @page {
      size: 80mm auto !important;
      margin: 0mm !important;
      padding: 0mm !important;
    }

    /* Preserve text formatting */
    .receipt-content p, 
    .receipt-content div, 
    .receipt-content span {
      font-family: 'Courier New', monospace !important;
      white-space: pre-wrap !important;
      margin-bottom: 1px !important; /* Reduced margin */
    }

    /* Support for horizontal lines */
    hr, .divider {
      border-top: 1px dashed black !important;
      margin: 2px 0 !important; /* Reduced margin */
      visibility: visible !important;
      display: block !important;
      width: 100% !important;
    }

    /* Support for text alignment */
    .text-center {
      text-align: center !important;
    }
    
    .text-right {
      text-align: right !important;
    }
    
    .text-bold {
      font-weight: bold !important;
    }

    /* Hide buttons and controls */
    button, .modal-buttons, .print-hidden, .preview-controls {
      display: none !important;
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
  saleDate : string
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
  saleDate
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

    // Create a hidden iframe for printing
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;

    if (frameDoc) {
      // Open document
      frameDoc.open();

      // Clone the receipt content
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;

      // Remove buttons/interactive elements
      const buttons = receiptClone.querySelectorAll("button, .print-hidden");
      buttons.forEach((btn) => btn.remove());

      // Write HTML with comprehensive styles
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${saleId}</title>
            <style>
              /* Essential print styles */
              @page {
                size: 80mm auto;
                margin: 0mm !important;
                padding: 0mm !important;
              }
              
              html, body {
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Courier New', monospace !important;
                font-size: 10px !important;
                line-height: 1.2 !important;
                background-color: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              * {
                box-sizing: border-box !important;
              }
              
              /* Receipt specific styles */
              .receipt-content {
                width: 80mm !important;
                padding: 5px !important;
                margin: 0 auto !important;
                font-family: 'Courier New', monospace !important;
                font-size: 10px !important;
              }
              
              .receipt-content p, 
              .receipt-content div, 
              .receipt-content span {
                font-family: 'Courier New', monospace !important;
                white-space: pre-wrap !important;
                margin-bottom: 2px !important;
              }
              
              hr, .divider {
                border-top: 1px dashed black !important;
                margin: 3px 0 !important;
                width: 100% !important;
              }
              
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-bold { font-weight: bold !important; }
            </style>
          </head>
          <body>
            <div class="receipt-content">
              ${receiptClone.innerHTML}
            </div>
          </body>
        </html>
      `);

      frameDoc.close();

      // Ensure content is loaded before printing
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            // Focus and print
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();

            // Cleanup after printing
            setTimeout(() => {
              document.body.removeChild(printFrame);
            }, 500);
          } catch (err) {
            console.error("Print error:", err);
            toast.error("Print failed. Please try again.");
            document.body.removeChild(printFrame);
          }
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
      tempDiv.style.lineHeight = "1.2";
      tempDiv.style.backgroundColor = "#fff";
      tempDiv.style.padding = "5px";
      tempDiv.style.margin = "0";
      tempDiv.style.border = "none";

      document.body.appendChild(tempDiv);

      // Clone receipt content and maintain styling
      const clonedContent = receiptRef.current.cloneNode(true) as HTMLElement;
      clonedContent.style.width = "100%";
      clonedContent.style.margin = "0";
      clonedContent.style.padding = "5px";
      clonedContent.style.overflow = "visible";
      clonedContent.style.maxHeight = "none"; // prevent clipping

      // Remove buttons or interactive elements
      const buttons = clonedContent.querySelectorAll("button, .print-hidden");
      buttons.forEach((btn) => btn.remove());

      tempDiv.appendChild(clonedContent);

      // Wait for layout/paint
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use html2canvas with higher quality settings
      const canvas = await html2canvas(clonedContent, {
        scale: 3, // Higher scale for better quality
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        imageTimeout: 0,
        removeContainer: false,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Calculate PDF size
      const canvasDataURL = canvas.toDataURL("image/png", 1.0);
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
        compress: true,
      });

      pdf.addImage(canvasDataURL, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${customer?.name || "Receipt"}-${saleId}.pdf`);
      toast.success("Receipt downloaded as PDF");
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  // Optimized thermal printing function with improved ESC/POS commands
  const handleThermalPrint = async () => {
    try {
      const receiptData = {
        cart,
        totalPrice,
        saleId,
        paymentMethod,
        customer,
        saleType,
        customTotalPrice,
      };
      // Try the service first
      const result = await thermalPrinterService.printReceipt(receiptData);

      if (result.includes("success")) {
        toast.success("Receipt sent to thermal printer");
        return;
      }
    } catch (serviceError) {
      console.error("Thermal printer service failed:", serviceError);

      try {
        if (navigator && "serial" in navigator && (navigator as any).serial) {
          const columnWidth = 42; // Standard 42 columns for 80mm thermal printer

          const receiptTree = (
            <ESCPrinter
              type="epson"
              width={columnWidth}
              characterSet="slovenia"
              initialize={true}
            >
              <Text align="center" bold size={{ width: 1, height: 1 }}>
                PKS TRADERS
              </Text>
              <Text align="center">Bill No: {saleId}</Text>
              <Text align="center">
                {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString()}
              </Text>
              <Line />

              <Text>
                {"Item".padEnd(24)}
                {"Qty".padEnd(5)}
                {"Price".padEnd(8)}
                {"Total"}
              </Text>
              <Line />

              {cart.map((item, idx) => {
                let name = item.name;
                if (name.length > 23) {
                  name = name.substring(0, 20) + "...";
                }

                const qtyStr = item.quantity.toString().padEnd(5);
                const priceStr = item.price.toFixed(2).padEnd(8);
                const totalStr = (item.quantity * item.price).toFixed(2);

                return (
                  <Text key={idx}>
                    {name.padEnd(24)}
                    {qtyStr}
                    {priceStr}
                    {totalStr}
                  </Text>
                );
              })}

              <Line />
              <Text align="right" bold>
                TOTAL: {(customTotalPrice ?? totalPrice).toFixed(2)}
              </Text>
              <Text>Paid via: {paymentMethod}</Text>
              {customer && <Text>Customer: {customer.name}</Text>}
              <Line />
              <Text align="center">Thank you for your business!</Text>
              <Text align="center">{new Date().toLocaleDateString()}</Text>
              <Cut partial={false} />
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
        console.error("Serial API error:", serialError);
        toast.error(
          "Thermal printing failed. Please check if printer is connected."
        );
        toast.info("Attempting to use browser printing instead...");
        handleBrowserPrint();
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

        {/* Receipt content with enhanced styling classes */}
        <div
          ref={receiptRef}
          className="receipt-content border rounded-lg p-2 mb-4 max-h-[70vh] overflow-y-auto receipt-container"
        >
          <Receipt
            cart={cart}
            totalPrice={totalPrice}
            saleId={saleId}
            paymentMethod={paymentMethod}
            customer={customer}
            saleType={saleType}
            customTotalPrice={customTotalPrice}
            saleDate={saleDate}
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
              handleThermalPrint();
              setTimeout(downloadReceiptAsPDF, 300);
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
