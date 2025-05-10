import {
  Text,
  Line,
  Cut,
  render as renderESC
} from "react-thermal-printer";
import moment from "moment";
import escpos from "escpos";
// Requiring the adapter and device based on your system
import USB from "escpos-usb";
// You might need to install node-gyp and rebuild for these dependencies

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

/**
 * Service for handling thermal printing functionalities
 */
export class ThermalPrinterService {
  private static instance: ThermalPrinterService;
  private printerConfig = {
    vendorId: 0x04b8, // Example Epson vendor ID - replace with your printer's vendor ID
    productId: 0x0202 // Example Epson product ID - replace with your printer's product ID
  };

  constructor() {
    // Singleton pattern
    if (ThermalPrinterService.instance) {
      return ThermalPrinterService.instance;
    }
    ThermalPrinterService.instance = this;
  }

  /**
   * Print receipt data to a thermal printer
   * @param receiptData The data to be printed
   * @returns Promise resolving to success or error message
   */
  async printReceipt(receiptData: ThermalReceiptData): Promise<string> {
    const {
      cart,
      totalPrice,
      saleId,
      paymentMethod,
      customer,
      saleType,
      customTotalPrice
    } = receiptData;
    
    try {
      // Get USB device
      const device = new USB(this.printerConfig);
      
      // Setup printer
      return new Promise((resolve, reject) => {
        try {
          const printer = new escpos.Printer(device);
          
          // Open the device
          device.open(async (error) => {
            if (error) {
              reject(`Failed to open device: ${error}`);
              return;
            }
            
            try {
              // Format and print the receipt
              this.formatReceipt(printer, receiptData);
              
              // Cut and finish
              printer
                .cut()
                .close();
                
              resolve("Receipt printed successfully");
            } catch (err) {
              reject(`Error during printing: ${err}`);
            }
          });
        } catch (err) {
          reject(`Failed to create printer: ${err}`);
        }
      });
    } catch (error) {
      console.error("Thermal printing failed:", error);
      return `Printing failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Helper method to format receipt content for printing
   * @param printer Initialized printer instance
   * @param receiptData Receipt data to format
   */
  private formatReceipt(printer: any, receiptData: ThermalReceiptData): void {
    const {
      cart,
      totalPrice,
      saleId,
      paymentMethod,
      customer,
      saleType,
      customTotalPrice
    } = receiptData;

    const displayTotal = customTotalPrice ?? totalPrice;
    
    // Store header
    printer
      .align("ct")
      .style("b")
      .size(1, 1) // Double size text
      .text("PKS TRADERS")
      .size(0, 0) // Normal size text
      .style("normal")
      .feed(1);
      
    // Receipt info
    printer
      .align("ct")
      .text("--------------------------------")
      .text(`Bill No: ${saleId}`)
      .text(`Date: ${moment().format("DD/MM/YYYY")}`)
      .text(`Time: ${moment().format("HH:mm:ss")}`);
      
    // Customer info if available
    if (customer && customer.name) {
      printer.text(`Customer: ${customer.name}`);
    }
    
    printer
      .text("--------------------------------")
      .align("lt")
      .style("b")
      .text("ITEM          QTY    RATE    TOTAL")
      .style("normal")
      .text("--------------------------------");
    
    // Print items
    cart.forEach((item, index) => {
      const originalPrice =
        item.price !== undefined
          ? item.price
          : saleType === "wholeSale"
          ? item.wholeSalePrice ?? item.retailPrice
          : item.retailPrice;
      
      // Format item name - truncate if too long
      let name = item.name.toUpperCase();
      if (name.length > 12) {
        name = `${name.substring(0, 9)}...`;
      }
      
      // Calculate item total
      const itemTotal = originalPrice * item.quantity;
      
      // Format line with proper spacing for thermal printer
      // First print item name on its own line if it's longer than 10 chars
      if (item.name.length > 10) {
        printer.text(`${name}`);
        printer.text(`  ${item.quantity.toString().padStart(5)} ${originalPrice.toFixed(2).padStart(8)} ${itemTotal.toFixed(2).padStart(8)}`);
      } else {
        // Shorter items can fit on one line
        printer.text(`${name.padEnd(12)} ${item.quantity.toString().padStart(5)} ${originalPrice.toFixed(2).padStart(8)} ${itemTotal.toFixed(2).padStart(8)}`);
      }
    });
    
    // Totals section
    printer
      .text("--------------------------------")
      .align("rt")
      .style("b")
      .text(`BILL AMOUNT: ${displayTotal.toFixed(2)}`)
      .style("normal");
    
    // Additional wholesale info if applicable
    if (saleType === "wholeSale") {
      const originalSubtotal = cart.reduce((acc, item) => {
        const originalPrice =
          saleType === "wholeSale" && item.price ? item.price : item.retailPrice;
        return acc + originalPrice * item.quantity;
      }, 0);
      
      printer.text(`Previous : ${originalSubtotal.toFixed(2)}`);
      
      if (customTotalPrice !== undefined) {
        printer.text(`Net Amount: ${customTotalPrice.toFixed(2)}`);
      }
    }
    
    // Payment details
    printer
      .text(`Debt Amount: ${customer ? customer.debtAmount || "0.00" : "0.00"}`)
      .text(`Paid : ${displayTotal.toFixed(2)}`)
      .text(`Payment Method: ${paymentMethod}`);
    
    // Footer
    printer
      .feed(1)
      .align("ct")
      .text("Thank you for your business!")
      .text("--------------------------------")
      .feed(2); // Add extra space before cutting
  }

  /**
   * Check if thermal printer is available and connected
   * @returns Promise resolving to connection status
   */
  async checkPrinterStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      // Try to get USB device
      const device = new USB(this.printerConfig);
      
      // Try to open the device to confirm connection
      return new Promise((resolve) => {
        device.open((error) => {
          if (error) {
            resolve({ 
              connected: false, 
              message: `Printer not available: ${error}` 
            });
            return;
          }
          
          // Close the device after successful test
          try {
            device.close();
            resolve({ connected: true, message: "Printer is connected and ready" });
          } catch (closeError) {
            resolve({ 
              connected: true, 
              message: "Printer is connected, but there was an issue closing the connection" 
            });
          }
        });
      });
    } catch (error) {
      return { 
        connected: false, 
        message: `Printer not available: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

// Export a singleton instance
export const thermalPrinterService = new ThermalPrinterService();

export default thermalPrinterService;