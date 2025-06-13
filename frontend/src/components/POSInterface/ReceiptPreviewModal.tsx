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
import moment from "moment";

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
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
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
  saleDate: string;
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
  saleDate,
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
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;

    if (frameDoc) {
      // Calculate original subtotal as per Receipt component
      const originalSubtotal = cart.reduce((acc, item) => {
        const originalPrice =
          saleType === "wholeSale" && item.price
            ? item.price
            : item.retailPrice;
        return acc + originalPrice * item.quantity;
      }, 0);

      const displayTotal = customTotalPrice ?? totalPrice;

      // Format date and time using moment to match Receipt
      const dateWithTime = `${saleDate}T${moment().format("HH:mm:ss")}`; // Add current time
      const formattedDate = moment(dateWithTime).format("DD/MM/YYYY");
      const formattedTime = moment(dateWithTime).format("HH:mm:ss");

      frameDoc.open();
      frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${saleId}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
              padding: 0mm;
            }

            html, body {
              margin: 0;
              padding: 0;
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.3;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .section-header {
              font-weight: bold;
              font-size: 11px;
              padding: 0 5mm;
              margin-bottom: 4px;
            }
            
            .receipt-content {
              width: 72mm;
              margin: 0 auto;
              padding: 5px 0;
            }

            .text-center {
              text-align: center;
            }

            .text-right {
              text-align: right;
            }

            .text-bold {
              font-size: 16px;
              font-weight: bold;
            }

            .divider {
              border-top: 1px dashed #000;
              margin: 3px 0;
            }

            .section {
              margin-bottom: 2px;
            }

            .table-header, .table-row {
              display: grid;
              grid-template-columns: 8% 38% 14% 20% 20%;
              width: 100%;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 2px 0;
            }

            .table-header {
              font-weight: bold;
              border-bottom: 1px dashed #000;
            }

            .table-row {
              font-weight: bold;
              margin-bottom: 2px;
            }

            .total-section {
              border-top: 1px dashed #000;
              padding-top: 5px;
              font-weight: bold;
              margin-top: 5px;
            }

            .flex {
              display: flex;
              font-weight: bold;
              justify-content: space-between;
            }

            .text-lg {
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-content">
            <div class="section text-center text-bold">PKS TRADERS</div>
            <div class="section-header flex">
              <span>Bill No: ${saleId}</span>
              <span>Date: ${formattedDate}</span>
            </div>
            ${
              customer
                ? `<div class="section-header">Customer: ${
                    customer.name || "No Name"
                  }</div>`
                : ""
            }
            <div class="divider"></div>

            <div class="table-header">
              <div>NO</div>
              <div>ITEM NAME</div>
              <div>QTY</div>
              <div>RATE</div>
              <div>TOTAL</div>
            </div>
            
            ${cart
              .map((item, idx) => {
                const originalPrice =
                  item.price !== undefined
                    ? item.price
                    : saleType === "wholeSale"
                    ? item.wholeSalePrice ?? item.retailPrice
                    : item.retailPrice;

                const formattedName =
                  item.name.length > 15
                    ? `${item.name.substring(0, 15)}...`
                    : item.name;

                return `
                <div class="table-row">
                  <div>${idx + 1}</div>
                  <div>${formattedName.toUpperCase()}</div>
                  <div>${item.quantity}</div>
                  <div>${originalPrice.toFixed(2)}</div>
                  <div>${(originalPrice * item.quantity).toFixed(2)}</div>
                </div>
              `;
              })
              .join("")}
            
            <div class="total-section">
              <div class="flex text-lg text-bold">
                <span>BILL AMOUNT :</span>
                <span>${displayTotal.toFixed(2)}</span>
              </div>
            </div>

            <div class="section">
              <div class="flex">
                <span>Debt Amount:</span>
                <span>${customer ? customer.debtAmount : "0.00"}</span>
              </div>
              <div class="flex">
                <span>Paid :</span>
                <span>${displayTotal.toFixed(2)}</span>
              </div>
            </div>

            <div class="divider"></div>
            <div class="section">
              Time: ${formattedTime}
            </div>
          </div>
        </body>
      </html>
    `);
      frameDoc.close();

      printFrame.onload = () => {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
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
  // const handleThermalPrint = async () => {
  //   try {
  //     const receiptData = {
  //       cart,
  //       totalPrice,
  //       saleId,
  //       paymentMethod,
  //       customer,
  //       saleType,
  //       customTotalPrice,
  //     };
  //     const result = await thermalPrinterService.printReceipt(receiptData);

  //     if (result.includes("success")) {
  //       toast.success("Receipt sent to thermal printer");
  //       return;
  //     }
  //   } catch (serviceError) {
  //     console.error("Thermal printer service failed:", serviceError);

  //     try {
  //       if (navigator && "serial" in navigator && navigator.serial) {
  //         const columnWidth = 48; // TVS RP3160 GOLD, Font A, 80mm paper
  //         const noWidth = 4; // "NO" (adjusted for spacing)
  //         const nameWidth = 18; // "ITEM NAME" (adjusted to fit)
  //         const qtyWidth = 6; // "QTY"
  //         const priceWidth = 10; // "RATE"
  //         const totalWidth = 10; // "TOTAL"

  //         // Calculate original subtotal as per Receipt component
  //         const originalSubtotal = cart.reduce((acc, item) => {
  //           const originalPrice =
  //             saleType === "wholeSale" && item.price
  //               ? item.price
  //               : item.retailPrice;
  //           return acc + originalPrice * item.quantity;
  //         }, 0);

  //         const displayTotal = customTotalPrice ?? totalPrice;

  //         // Format date and time using moment to match Receipt
  //         const formattedDate = moment(saleDate).format("DD/MM/YYYY");
  //         const formattedTime = moment(saleDate).format("HH:mm:ss");

  //         const receiptTree = (
  //           <ESCPrinter
  //             type="epson"
  //             width={columnWidth}
  //             initialize={true} // Omit characterSet to use default (likely PC437)
  //           >
  //             {/* Header */}
  //             <Text align="center" bold>
  //               PKS TRADERS
  //             </Text>
  //             <Text align="center">Bill No: {saleId}</Text>
  //             <Text align="center">Date: {formattedDate}</Text>
  //             {customer && (
  //               <Text align="center">To: {customer.name || "No Name"}</Text>
  //             )}
  //             <Line />

  //             {/* Table Header */}
  //             <Text align="left">
  //               {"NO".padEnd(noWidth)}
  //               {"ITEM NAME".padEnd(nameWidth)}
  //               {"QTY".padEnd(qtyWidth)}
  //               {"RATE".padEnd(priceWidth)}
  //               {"TOTAL".padEnd(totalWidth)}
  //             </Text>
  //             <Line />

  //             {/* Table Rows */}
  //             {cart.map((item, idx) => {
  //               const noStr = (idx + 1).toString().padEnd(noWidth);
  //               // Format item name to wrap if >18 chars (adjusted for thermal width)
  //               const formattedName =
  //                 item.name.length > nameWidth - 3
  //                   ? `${item.name.substring(0, nameWidth - 3)}...`
  //                   : item.name.padEnd(nameWidth);
  //               const qtyStr = item.quantity.toString().padEnd(qtyWidth);
  //               const originalPrice =
  //                 item.price !== undefined
  //                   ? item.price
  //                   : saleType === "wholeSale"
  //                   ? item.wholeSalePrice ?? item.retailPrice
  //                   : item.retailPrice;
  //               const priceStr = originalPrice.toFixed(2).padEnd(priceWidth);
  //               const totalStr = (originalPrice * item.quantity)
  //                 .toFixed(2)
  //                 .padEnd(totalWidth);

  //               return (
  //                 <Text key={idx} align="left">
  //                   {noStr}
  //                   {formattedName.toUpperCase()}
  //                   {qtyStr}
  //                   {priceStr}
  //                   {totalStr}
  //                 </Text>
  //               );
  //             })}

  //             <Line />
  //             {/* Total Section */}
  //             <Text align="left">
  //               {"BILL AMOUNT :".padEnd(
  //                 columnWidth - displayTotal.toFixed(2).length
  //               )}
  //               {displayTotal.toFixed(2)}
  //             </Text>

  //             {/* Payment and Balance Info */}
  //             {saleType === "wholeSale" && (
  //               <>
  //                 <Text align="left">
  //                   {"Previous :".padEnd(
  //                     columnWidth - originalSubtotal.toFixed(2).length
  //                   )}
  //                   {originalSubtotal.toFixed(2)}
  //                 </Text>
  //                 {customTotalPrice !== undefined && (
  //                   <Text align="left">
  //                     {"Net Amount:".padEnd(
  //                       columnWidth - customTotalPrice.toFixed(2).length
  //                     )}
  //                     {customTotalPrice.toFixed(2)}
  //                   </Text>
  //                 )}
  //               </>
  //             )}
  //             <Text align="left">
  //               {"Debt Amount:".padEnd(
  //                 columnWidth -
  //                   (customer?.debtAmount || "0.00").toString().length
  //               )}
  //               {customer ? customer.debtAmount : "0.00"}
  //             </Text>
  //             <Text align="left">
  //               {"Paid :".padEnd(columnWidth - displayTotal.toFixed(2).length)}
  //               {displayTotal.toFixed(2)}
  //             </Text>

  //             <Line />
  //             {/* Time */}
  //             <Text align="left">Time: {formattedTime}</Text>
  //             <Cut partial={false} />
  //           </ESCPrinter>
  //         );

  //         const escposData = await renderESC(receiptTree);

  //         const port = await (navigator as any).serial.requestPort();
  //         await port.open({ baudRate: 115200 }); // For better clarity
  //         const writer = port.writable?.getWriter();

  //         if (writer) {
  //           const densityCommand = new Uint8Array([
  //             0x1d, 0x28, 0x45, 0x02, 0x00, 0x01, 0x02,
  //           ]); // Example: high density
  //           const finalData = new Uint8Array([
  //             ...densityCommand,
  //             ...escposData,
  //           ]);
  //           await writer.write(finalData);
  //           writer.releaseLock();
  //           await port.close();
  //           toast.success("Receipt printed successfully");
  //         }
  //       } else {
  //         toast.error("Web Serial API not supported in this browser");
  //       }
  //     } catch (serialError) {
  //       console.error("Serial API error:", serialError);
  //       toast.error(
  //         "Thermal printing failed. Please check if printer is connected."
  //       );
  //       toast.info("Attempting to use browser printing instead...");
  //       handleBrowserPrint();
  //     }
  //   }
  // };

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
            Thermal Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
