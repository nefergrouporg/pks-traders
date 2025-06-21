import React, { useRef, useEffect, useState } from "react";
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
      line-height: 1.1 !important;
      background-color: white !important;
      color: black !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    * {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
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
      padding: 2px !important;
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
      margin-bottom: 1px !important;
    }

    /* Support for horizontal lines */
    hr, .divider {
      border-top: 1px dashed black !important;
      margin: 2px 0 !important;
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
  payments: Payment[];
  customer?: any;
  saleType: "retail" | "wholeSale" | "hotel"; // Updated to include "hotel"
  customTotalPrice?: number;
  saleDate: string;
  autoDownloadPDF?: boolean;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalPrice,
  saleId,
  payments,
  customer,
  saleType = "retail",
  customTotalPrice,
  saleDate,
  autoDownloadPDF = false,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const printStylesRef = useRef<HTMLStyleElement | null>(null);
  const hasAutoDownloaded = useRef(false);
  const [focusedButtonIndex, setFocusedButtonIndex] = useState(0);
  const downloadRef = useRef<HTMLButtonElement>(null);
  const printRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          setFocusedButtonIndex((prev) => (prev + 1) % 3);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setFocusedButtonIndex((prev) => (prev - 1 + 3) % 3);
          break;
        case "Enter":
          e.preventDefault();
          if (focusedButtonIndex === 0 && downloadRef.current) {
            downloadRef.current.click();
          } else if (focusedButtonIndex === 1 && printRef.current) {
            printRef.current.click();
          } else if (focusedButtonIndex === 2 && closeRef.current) {
            closeRef.current.click();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedButtonIndex, onClose]);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.appendChild(document.createTextNode(THERMAL_RECEIPT_STYLES));
    document.head.appendChild(styleElement);
    printStylesRef.current = styleElement;

    return () => {
      if (printStylesRef.current) {
        document.head.removeChild(printStylesRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the first button when modal opens
    if (downloadRef.current) {
      downloadRef.current.focus();
      setFocusedButtonIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (
      isOpen &&
      autoDownloadPDF &&
      !hasAutoDownloaded.current &&
      receiptRef.current
    ) {
      // Add a small delay to ensure the modal content is fully rendered
      const timer = setTimeout(() => {
        downloadReceiptAsPDF();
        hasAutoDownloaded.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }

    // Reset the flag when modal closes
    if (!isOpen) {
      hasAutoDownloaded.current = false;
    }
  }, [isOpen, autoDownloadPDF]);

  if (!isOpen) return null;

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
      // Calculate values to match Receipt.tsx
      const paymentsArray = payments || [];
      const received = paymentsArray
        .filter((p) => p.method !== "debt")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const debtAdded = paymentsArray
        .filter((p) => p.method === "debt")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const billAmount = customTotalPrice ?? totalPrice;
      const previousDebt = customer
        ? parseFloat(customer.debtAmount || "0")
        : 0;
      const unpaid = Math.max(0, billAmount - received);
      const updatedDebt = previousDebt + billAmount - received;
      const netAmount = previousDebt + billAmount;

      const dateWithTime = `${saleDate}T${moment().format("HH:mm:ss")}`;
      const formattedDate = moment(dateWithTime).format("DD/MM/YYYY");
      const formattedTime = moment(dateWithTime).format("HH:mm:ss");

      // Define grid columns based on saleType
      const gridColumns =
        saleType === "hotel" ? "8% 48% 14% 30%" : "8% 38% 14% 20% 20%";

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

              <div class="table-header" style="grid-template-columns: ${gridColumns};">
                <div>NO</div>
                <div>ITEM NAME</div>
                <div>QTY</div>
                ${saleType !== "hotel" ? "<div>RATE</div>" : ""}
                <div>TOTAL</div>
              </div>
              
              ${cart
                .map((item, idx) => {
                  const originalPrice = item.price;
                  const formattedName =
                    item.name.length > 15
                      ? `${item.name.substring(0, 15)}...`
                      : item.name;
                  return `
                    <div class="table-row" style="grid-template-columns: ${gridColumns};">
                      <div>${idx + 1}</div>
                      <div>${formattedName.toUpperCase()}</div>
                      <div>${item.quantity}</div>
                      ${
                        saleType !== "hotel"
                          ? `<div>${originalPrice.toFixed(2)}</div>`
                          : ""
                      }
                      <div>${(originalPrice * item.quantity).toFixed(2)}</div>
                    </div>
                  `;
                })
                .join("")}
              
              <div class="total-section">
                <div class="flex text-lg text-bold">
                  <span>BILL AMOUNT :</span>
                  <span>${billAmount.toFixed(2)}</span>
                </div>
              </div>

              <div class="section">
                ${
                  customer
                    ? `
                  <div class="flex">
                    <span>PREVIOUS:</span>
                    <span>${previousDebt.toFixed(2)}</span>
                  </div>
                  <div class="flex">
                    <span>NET AMOUNT:</span>
                    <span>${netAmount.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
                <div class="flex">
                  <span>REC AMOUNT:</span>
                  <span>${received.toFixed(2)}</span>
                </div>
                ${
                  customer
                    ? `
                  <div class="flex">
                    <span>BALANCE:</span>
                    <span>${updatedDebt.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
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

  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "80mm";
      tempDiv.style.fontFamily = "'Courier New', monospace";
      tempDiv.style.fontSize = "10px";
      tempDiv.style.lineHeight = "1.2";
      tempDiv.style.backgroundColor = "#fff";
      tempDiv.style.margin = "0";
      tempDiv.style.border = "none";

      document.body.appendChild(tempDiv);

      const clonedContent = receiptRef.current.cloneNode(true) as HTMLElement;
      clonedContent.style.width = "100%";
      clonedContent.style.margin = "0";
      clonedContent.style.padding = "5px";
      clonedContent.style.overflow = "visible";
      clonedContent.style.maxHeight = "none";

      const buttons = clonedContent.querySelectorAll("button, .print-hidden");
      buttons.forEach((btn) => btn.remove());

      tempDiv.appendChild(clonedContent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clonedContent, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        imageTimeout: 0,
        removeContainer: false,
      });

      document.body.removeChild(tempDiv);

      const canvasDataURL = canvas.toDataURL("image/png", 1.0);
      const imgProps = {
        width: canvas.width,
        height: canvas.height,
      };
      const pdfWidth = 80;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Receipt Preview</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className={`text-gray-500 hover:text-gray-700 text-base sm:text-lg font-medium px-3 py-1.5 rounded-md transition
              ${focusedButtonIndex === 2 ? "ring-2 ring-blue-500" : ""}`}
            tabIndex={-1}
          >
            ×{" "}
            <span className="text-sm text-gray-400 ml-1">
              (or press Escape)
            </span>
          </button>
        </div>

        <div
          ref={receiptRef}
          className="receipt-content border rounded-lg p-2 mb-4 max-h-[70vh] overflow-y-auto receipt-container"
        >
          <Receipt
            cart={cart}
            totalPrice={totalPrice}
            saleId={saleId}
            payments={payments}
            customer={customer}
            saleType={saleType}
            customTotalPrice={customTotalPrice}
            saleDate={saleDate}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            ref={downloadRef}
            onClick={downloadReceiptAsPDF}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              focusedButtonIndex === 0 ? "ring-2 ring-blue-500" : ""
            }`}
            tabIndex={-1}
          >
            Download PDF
          </button>
          <button
            ref={printRef}
            onClick={handleBrowserPrint}
            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
              focusedButtonIndex === 1 ? "ring-2 ring-blue-500" : ""
            }`}
            tabIndex={-1}
          >
            Thermal Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
