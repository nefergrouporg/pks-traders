import {
  Printer as ESCPrinter,
  Text,
  Line,
  Cut,
  render as renderESC,
} from "react-thermal-printer";
import moment from "moment";
import React from "react";
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
}

// Network printer configuration - only using WiFi as requested
interface NetworkPrinterConfig {
  address: string; // IP address
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
      // For network printing, we'll use a simple fetch to a backend endpoint
      // You'll need to implement this endpoint on your server
      const response = await fetch("/api/print-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printerConfig: this.printerConfig,
          receiptData,
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
  } = receiptData;

  const displayTotal = customTotalPrice ?? totalPrice;

  return (
    <ESCPrinter
      type="epson"
      width={42}
      characterSet="slovenia"
      initialize // Default initialization includes 0x1B 0x40
    >
      {/* Manual alignment and formatting */}
      <Text align="left">
        {/* Left alignment using built-in prop */}
        <Text bold size={{ width: 1, height: 1 }} align="center">
          PKS TRADERS
        </Text>
        <Line />

        {/* Compact content */}
        <Text align="center">Bill No: {saleId}</Text>
        <Text align="center">{moment().format("DD/MM/YYYY HH:mm")}</Text>

        {customer?.name && <Text>Customer: {customer.name}</Text>}

        <Line />
        <Text bold>ITEM       QTY  RATE   TOTAL</Text>
        <Line />

        {cart.map((item, idx) => {
          const name = item.name.length > 10 
            ? `${item.name.substring(0, 8)}..` 
            : item.name;
          const itemTotal = item.price * item.quantity;

          return (
            <Text key={idx}>
              {name.padEnd(10)} {item.quantity.toString().padStart(3)}
              {item.price.toFixed(2).padStart(7)}
              {itemTotal.toFixed(2).padStart(8)}
            </Text>
          );
        })}

        <Line />
        <Text align="right" bold>
          TOTAL: {displayTotal.toFixed(2)}
        </Text>

        <Text>Paid via: {paymentMethod}</Text>
        {customer?.debtAmount > 0 && <Text>Debt: {customer.debtAmount}</Text>}

        <Text align="center">Thank you!</Text>
        <Line />
        <Cut />
      </Text>
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
   * Simple direct print function for browser testing
   * @param receiptData Receipt data to print
   */
  async directPrint(receiptData: ThermalReceiptData): Promise<string> {
    try {
      // Create a temporary hidden iframe for printing
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";

      document.body.appendChild(printFrame);

      // Get the iframe's document
      const frameDoc = printFrame.contentWindow?.document;

      if (!frameDoc) {
        throw new Error("Could not access print frame document");
      }

      frameDoc.open();

      // Generate receipt content
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

      // Create a minimal HTML receipt - optimized to reduce blank space
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${saleId}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 10px; /* Smaller font */
                line-height: 1.1; /* Tighter line spacing */
                margin: 0;
                padding: 3px;
                width: 80mm;
              }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .line { 
                border-top: 1px dashed #000;
                margin: 3px 0; /* Reduced margin */
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                margin: 1px 0; /* Very tight spacing */
              }
              .compact {
                margin: 0;
                padding: 0;
              }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 12px;">PKS TRADERS</div>
            <div class="line"></div>
            <div class="center compact">Bill No: ${saleId} | ${moment().format(
        "DD/MM/YYYY HH:mm"
      )}</div>
            ${
              customer && customer.name
                ? `<div class="compact">Customer: ${customer.name}</div>`
                : ""
            }
            <div class="line"></div>
            <div class="bold compact">ITEM       QTY  RATE   TOTAL</div>
            <div class="line"></div>
            ${cart
              .map((item) => {
                const itemTotal = item.price * item.quantity;
                let name = item.name;
                if (name.length > 10) name = `${name.substring(0, 8)}..`;

                return `<div class="item-row compact">${name.padEnd(
                  10
                )} ${item.quantity.toString().padStart(3)} ${item.price
                  .toFixed(2)
                  .padStart(6)} ${itemTotal.toFixed(2).padStart(6)}</div>`;
              })
              .join("")}
            <div class="line"></div>
            <div class="right bold compact">TOTAL: ${displayTotal.toFixed(
              2
            )}</div>
            <div class="compact">Paid via: ${paymentMethod}</div>
            ${
              customer && customer.debtAmount && Number(customer.debtAmount) > 0
                ? `<div class="compact">Debt: ${customer.debtAmount}</div>`
                : ""
            }
            <div class="center compact" style="margin-top: 3px;">Thank you!</div>
          </body>
        </html>
      `);

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
}

// Export a singleton instance
export const thermalPrinterService = new ThermalPrinterService();

export default thermalPrinterService;
