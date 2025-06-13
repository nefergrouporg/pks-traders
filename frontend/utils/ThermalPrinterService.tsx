import {
  Printer as ESCPrinter,
  Text,
  Line,
  Cut,
  render as renderESC,
} from "react-thermal-printer";
import moment from "moment";
import { toast } from "react-toastify";

// Define a common interface for receipt data that matches your requirements
interface ThermalReceiptData {
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
  saleDate: Date | string; 
}

// Network printer configuration - only using WiFi as requested
interface NetworkPrinterConfig {
  address: string; 
  port: number; // Port number, typically 9100
}

/**
 * Service for handling thermal printing functionalities
 */
export class ThermalPrinterService {
  private static instance: ThermalPrinterService;
  private printerConfig: NetworkPrinterConfig = {
    address: "192.168.1.100", // Default IP - should be configured
    port: 9100, // Default port for most network printers
  };

  constructor() {
    // Singleton pattern
    if (ThermalPrinterService.instance) {
      return ThermalPrinterService.instance;
    }
    ThermalPrinterService.instance = this;
  }

  /**
   * Configure the printer connection
   * @param config The printer configuration
   */
  configurePrinter(config: NetworkPrinterConfig): void {
    this.printerConfig = config;
  }

  /**
   * Print receipt data to a thermal printer
   * @param receiptData The data to be printed
   * @returns Promise resolving to success or error message
   */
  async printReceipt(receiptData: ThermalReceiptData): Promise<string> {
    try {
      // First try using Web Serial API for direct connection
      if (navigator && "serial" in navigator) {
        return this.printWithWebSerial(receiptData);
      } else {
        // Fall back to network printing if Web Serial API is not available
        return this.printWithNetworkPrinter(receiptData);
      }
    } catch (error) {
      console.error("Thermal printing failed:", error);
      return `Printing failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Print with Web Serial API (for USB connected thermal printers)
   * @param receiptData Receipt data to print
   * @returns Promise resolving to success or error message
   */
  private async printWithWebSerial(
    receiptData: ThermalReceiptData
  ): Promise<string> {
    try {
      // Generate receipt content using react-thermal-printer
      const receiptTree = this.createReceiptTree(receiptData);
      const escposData = await renderESC(receiptTree);

      // Request port access
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      // Write to the printer
      const writer = port.writable?.getWriter();

      if (!writer) {
        throw new Error("Could not get writer for serial port");
      }

      await writer.write(escposData);
      writer.releaseLock();
      await port.close();

      return "Receipt printed successfully via Web Serial API";
    } catch (error) {
      console.error("Serial printing error:", error);
      throw new Error(
        `Web Serial printing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Print with network printer
   * @param receiptData Receipt data to print
   * @returns Promise resolving to success or error message
   */
  private async printWithNetworkPrinter(
    receiptData: ThermalReceiptData
  ): Promise<string> {
    try {
      // Generate receipt content using react-thermal-printer
      const receiptTree = this.createReceiptTree(receiptData);
      const escposData = await renderESC(receiptTree);

      // For network printing, we'll use a simple fetch to a backend endpoint
      const response = await fetch("/api/print-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printerConfig: this.printerConfig,
          receiptData,
          // Include the ESC/POS raw data for direct printing
          escposData: Array.from(escposData), // Convert to array for JSON serialization
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network printing failed: ${errorText}`);
      }

      const result = await response.json();
      return result.message || "Receipt printed successfully via network";
    } catch (error) {
      console.error("Network printing error:", error);
      throw new Error(
        `Network printing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Creates a React element tree for the receipt
   * @param receiptData The receipt data
   * @returns JSX element for the receipt
   */
  private createReceiptTree(receiptData: ThermalReceiptData) {
    const {
      cart,
      totalPrice,
      saleId,
      paymentMethod,
      customer,
      saleType,
      customTotalPrice,
      saleDate,
    } = receiptData;

    const displayTotal = customTotalPrice ?? totalPrice;

    const isPaperNarrow = true; // true for 58mm, false for 80mm
    const characterWidth = isPaperNarrow ? 32 : 48;

    // Column widths
    const NO_WIDTH = 3;
    const ITEM_NAME_WIDTH = 15;
    const QTY_WIDTH = 4;
    const RATE_WIDTH = 8;
    const TOTAL_WIDTH = 8;

    const timeStr = moment(saleDate).format("HH:mm:ss");
    const dateStr = moment(saleDate).format("DD/MM/YYYY");

    return (
      <ESCPrinter
        type="epson"
        width={characterWidth}
        characterSet="slovenia"
        initialize
      >
        {/* Header */}
        <Text align="center" bold size={{ width: 1, height: 1 }}>
          PKS TRADERS
        </Text>
        <Line />

        <Text align="center">Bill No: {saleId}</Text>
        <Text align="center">Date: {dateStr}</Text>
        <Text align="center">To : {customer?.name || "customer"}</Text>
        <Line />

        {/* Table Header */}
        <Text>
          {"NO".padEnd(NO_WIDTH)}
          {"ITEM NAME".padEnd(ITEM_NAME_WIDTH)}
          {"QTY".padEnd(QTY_WIDTH)}
          {"RATE".padEnd(RATE_WIDTH)}
          {"TOTAL".padEnd(TOTAL_WIDTH)}
        </Text>
        <Line />

        {/* Items */}
        {cart.map((item, idx) => {
          const no = String(idx + 1).padEnd(NO_WIDTH);
          const name =
            item.name.length > ITEM_NAME_WIDTH
              ? item.name.substring(0, ITEM_NAME_WIDTH - 2) + ".."
              : item.name.padEnd(ITEM_NAME_WIDTH);
          const qty = String(item.quantity).padEnd(QTY_WIDTH);
          const rate = item.price.toFixed(2).padEnd(RATE_WIDTH);
          const total = (item.quantity * item.price)
            .toFixed(2)
            .padEnd(TOTAL_WIDTH);

          return (
            <Text key={idx}>
              {no}
              {name}
              {qty}
              {rate}
              {total}
            </Text>
          );
        })}

        <Line />

        {/* Bill Amount Section */}
        <Text align="right" bold>
          BILL AMOUNT : {displayTotal.toFixed(2)}
        </Text>
        <Text>Debt Amount: {customer?.debtAmount?.toFixed(2) || "0.00"}</Text>
        <Text>Paid : {displayTotal.toFixed(2)}</Text>
        <Text>Time : {timeStr}</Text>

        <Line />
        <Cut />
      </ESCPrinter>
    );
  }

  /**
   * Renders the receipt for display or other use
   * @param receiptData Receipt data to render
   * @returns Rendered ESC/POS data
   */
  async renderReceipt(receiptData: ThermalReceiptData): Promise<Uint8Array> {
    const receiptTree = this.createReceiptTree(receiptData);
    return await renderESC(receiptTree);
  }

  /**
   * Check if thermal printer is available and connected
   * @returns Promise resolving to connection status
   */
  async checkPrinterStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      // For Web Serial API
      if (navigator && "serial" in navigator) {
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
          return { connected: true, message: "USB printer is available" };
        } else {
          return {
            connected: false,
            message: "No USB printers found. Click 'Thermal Print' to connect.",
          };
        }
      }

      // For network printer
      try {
        const response = await fetch(
          `/api/check-printer?ip=${this.printerConfig.address}`
        );
        if (response.ok) {
          return { connected: true, message: "Network printer is available" };
        } else {
          return {
            connected: false,
            message: `Network printer not responding at ${this.printerConfig.address}`,
          };
        }
      } catch (networkError) {
        return {
          connected: false,
          message: `Network printer check failed: ${
            networkError instanceof Error
              ? networkError.message
              : String(networkError)
          }`,
        };
      }
    } catch (error) {
      return {
        connected: false,
        message: `Printer status check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Improved direct print function for thermal printers
   * Instead of using iframe HTML which doesn't translate well to thermal printers,
   * this method uses the ESC/POS commands directly
   * @param receiptData Receipt data to print
   */
  async directPrint(receiptData: ThermalReceiptData): Promise<string> {
    try {
      // For direct printing, we'll use the same approach as Web Serial API
      // but send it to the printer via another method

      // First check if we have a printer connected via Web Serial API
      if (navigator && "serial" in navigator) {
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
          // If we have a connected printer, use Web Serial API
          return this.printWithWebSerial(receiptData);
        }
      }

      // If no Web Serial API printer, try network printing
      const status = await this.checkPrinterStatus();
      if (status.connected) {
        return this.printWithNetworkPrinter(receiptData);
      }

      // If no printer is available, fallback to browser printing
      // but warn the user that formatting may be limited
      toast.warning(
        "No thermal printer detected. Using browser print which may have limited formatting."
      );

      // Generate a printable HTML version that's optimized for thermal paper
      const receiptHtml = this.generateThermalFriendlyHtml(receiptData);

      // Create a temporary iframe for printing
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        throw new Error("Could not access print frame document");
      }

      frameDoc.open();
      frameDoc.write(receiptHtml);
      frameDoc.close();

      // Print after content is loaded
      return new Promise((resolve) => {
        printFrame.onload = () => {
          setTimeout(() => {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();

            // Remove the iframe after printing
            setTimeout(() => {
              document.body.removeChild(printFrame);
              resolve("Receipt sent to browser printing");
            }, 500);
          }, 300);
        };
      });
    } catch (error) {
      console.error("Direct printing error:", error);
      return `Direct printing failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Generate HTML optimized for thermal printers
   * @param receiptData Receipt data
   * @returns HTML string
   */
  private generateThermalFriendlyHtml(receiptData: ThermalReceiptData): string {
    const {
      cart,
      totalPrice,
      saleId,
      paymentMethod,
      customer,
      saleType,
      customTotalPrice,
    } = receiptData;

    const displayTotal = customTotalPrice ?? totalPrice;

    // Calculate character spacing for thermal paper
    const isPaperNarrow = true; // Set to true for 58mm paper, false for 80mm
    const paperWidth = isPaperNarrow ? "58mm" : "80mm";
    const characterWidth = isPaperNarrow ? 32 : 48;

    // Define column widths
    const QTY_WIDTH = 3;
    const PRICE_WIDTH = 6;
    const TOTAL_WIDTH = 6;
    const ITEM_NAME_WIDTH =
      characterWidth - QTY_WIDTH - PRICE_WIDTH - TOTAL_WIDTH - 3; // 3 spaces for separators

    // Generate item rows
    let itemRows = "";
    cart.forEach((item) => {
      const name =
        item.name.length > ITEM_NAME_WIDTH
          ? `${item.name.substring(0, ITEM_NAME_WIDTH - 2)}..`
          : item.name.padEnd(ITEM_NAME_WIDTH);
      const qty = item.quantity.toString().padStart(QTY_WIDTH);
      const price = item.price.toFixed(2).padStart(PRICE_WIDTH);
      const itemTotal = (item.price * item.quantity)
        .toFixed(2)
        .padStart(TOTAL_WIDTH);

      itemRows += `<div class="item-row">${name} ${qty} ${price} ${itemTotal}</div>`;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${saleId}</title>
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              width: ${paperWidth};
              margin: 0;
              padding: 5px;
              /* This is critical - ensure content will print correctly on thermal paper */
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .center {
              text-align: center;
            }
            .right {
              text-align: right;
            }
            .bold {
              font-weight: bold;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .item-row {
              white-space: pre; /* Critical for maintaining space-based formatting */
              font-family: monospace;
              line-height: 1.2;
            }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 5px;
            }
            /* Key thermal printer CSS */
            @media print {
              body {
                width: ${paperWidth};
                margin: 0;
                padding: 0;
              }
              /* Force monospace and eliminate padding/margins */
              * {
                font-family: 'Courier New', monospace;
                box-sizing: border-box;
              }
              /* Ensure space-based formatting is preserved */
              .item-row {
                white-space: pre;
                font-family: monospace;
              }
              /* Ensure the content fits the thermal paper width */
              .container {
                width: 100%;
                max-width: ${paperWidth};
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">PKS TRADERS</div>
            <div class="line"></div>
            <div class="center">Bill No: ${saleId}</div>
            <div class="center">${moment().format("DD/MM/YYYY HH:mm")}</div>
            ${
              customer && customer.name
                ? `<div>Customer: ${customer.name}</div>`
                : ""
            }
            <div class="line"></div>
            <div class="bold">ITEM${" ".repeat(
              ITEM_NAME_WIDTH - 4
            )} QTY PRICE TOTAL</div>
            <div class="line"></div>
            ${itemRows}
            <div class="line"></div>
            <div class="total">TOTAL: ${displayTotal.toFixed(2)}</div>
            <div>Paid via: ${paymentMethod}</div>
            ${
              customer && customer.debtAmount && Number(customer.debtAmount) > 0
                ? `<div>Debt: ${customer.debtAmount}</div>`
                : ""
            }
            <div class="center" style="margin-top: 10px;">Thank you!</div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export a singleton instance
export const thermalPrinterService = new ThermalPrinterService();

export default thermalPrinterService;
