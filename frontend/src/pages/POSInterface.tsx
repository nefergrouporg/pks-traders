import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { baseUrl } from "../../utils/services";
import Receipt from "../components/POSInterface/Receipt";
import ReceiptPreviewModal from "../components/POSInterface/ReceiptPreviewModal";
import CustomerSelectionModal from "../components/POSInterface/CustomerSelectionModal";
import PaymentStepper from "../components/POSInterface/PaymentStepper";
import BarcodeScanner from "../components/POSInterface/BarcodeScanner";
import ProductList from "../components/POSInterface/ProductList";
import ShoppingCart from "../components/POSInterface/ShoppingCart";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  stock: number;
  unitType: "pcs" | "kg";
  category: string;
  batchNumber: string;
  lowStockThreshold: number;
  supplierId: number;
  createdAt: string;
  updatedAt: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <button
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const POSInterface: React.FC = () => {
  // State management
  const [cart, setCart] = useState<
    Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      unitType: "pcs" | "kg";
    }>
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState(-1);
  const [isSaleComplete, setIsSaleComplete] = useState(false);
  const [pendingSale, setPendingSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "card" | "upi" | undefined
  >(undefined);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [currentStepperStep, setCurrentStepperStep] = useState(1);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const resetSaleState = () => {
    setCart([]);
    setCurrentSaleId(-1);
    setIsSaleComplete(false);
    setPendingSale(null);
    setIsStepperOpen(false);
    setCurrentStepperStep(1);
    setSelectedPaymentMethod(undefined);
    setPaymentQR(null);
    setShowReceipt(false);
    setIsPreviewOpen(false);
    setSelectedCustomer(null);
  };

  const token = localStorage.getItem("token");

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setCustomers(response.data.customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/products`);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    loadProducts();
  }, []);

  // Cart operations
  const addToCart = (product: {
    id: number;
    name: string;
    price: number;
    unitType: "pcs" | "kg";
  }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      return existingItem
        ? prevCart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.unitType === "pcs" ? item.quantity + 1 : item.quantity,
                }
              : item
          )
        : [
            ...prevCart,
            { ...product, quantity: product.unitType === "pcs" ? 1 : 0 },
          ];
    });
  };

  const increaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: parseFloat(
                (item.quantity + (item.unitType === "kg" ? 0.1 : 1)).toFixed(2)
              ),
            }
          : item
      )
    );
  };

  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: parseFloat(
                Math.max(
                  0,
                  item.quantity - (item.unitType === "kg" ? 0.1 : 1)
                ).toFixed(2)
              ),
            }
          : item
      )
    );
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(newQuantity, 0) }
          : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Barcode scanning
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/products/${barcode.trim()}`
      );
      if (response.data) {
        addToCart(response.data);
      } else {
        toast.error("Product not found!");
      }
    } catch (error) {
      console.error("API error:", error);
      toast.error("Error scanning product");
    }
  };

  // Receipt handling
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        setShowReceipt(true);
        setTimeout(() => resolve(), 100);
      });
    },
    removeAfterPrint: false,
  });

  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.appendChild(receiptRef.current.cloneNode(true));
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv.firstChild as HTMLElement, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width
      );
      pdf.save(`receipt-${currentSaleId}.pdf`);
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  // Sale processing
  const createPendingSale = async (method: "cash" | "card" | "upi") => {
    try {
      const token = localStorage.getItem("token");
      const saleData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: method.toLowerCase(), // Ensure lowercase
        customerId: selectedCustomer ? selectedCustomer.id : null,
      };

      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response, "askjdfhak;lsh");

      setCurrentSaleId(response?.data.sale?.id);
      setPendingSale(response?.data.sale);

      if (method === "upi" && response.data.paymentQR) {
        setPaymentQR(response.data.paymentQR); // ✅ Ensure QR code is set
        console.log(paymentQR);
      }

      return response?.data.sale;
    } catch (error) {
      console.error("Sale creation failed:", error);
      toast.error(error?.response?.data?.error || "Failed to create sale");
      return null;
    }
  };

  const confirmPayment = async (
    saleId: number,
    paymentMethod: "cash" | "card" | "upi"
  ) => {
    try {
      await axios.post(`${baseUrl}/api/payments/confirm`, {
        saleId,
        paymentMethod,
      });

      toast.success("Payment confirmed!");
      setIsSaleComplete(true);
      setIsStepperOpen(false);
      setShowReceipt(true);

      // For cash payments, automatically print and download
      if (paymentMethod === "cash") {
        setTimeout(() => {
          downloadReceiptAsPDF();
          handlePrint();
          setTimeout(() => resetSaleState(), 500);
        }, 300);
      }
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      toast.error("Failed to confirm payment. Please try again.");
      setIsStepperOpen(true);
    }
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error("Cannot create sale with empty cart");
      return;
    }

    if (!selectedCustomer) {
      toast.error("Please select a customer before creating sale");
      setIsCustomerModalOpen(true); // Automatically open customer modal
      return;
    }

    setIsStepperOpen(true);
    setCurrentStepperStep(1);
    setSelectedPaymentMethod(undefined);
    setPaymentQR(null);
    setIsSaleComplete(false);
    setPendingSale(null);

    // Create the pending sale immediately when the stepper opens
    // try {
    //   const sale = await createPendingSale("cash"); // Default to cash, can be changed later
    //   if (sale) {
    //     setCurrentSaleId(sale.id);
    //     setPendingSale(sale);
    //   }
    // } catch (error) {
    //   console.error("Failed to create pending sale:", error);
    //   toast.error("Failed to initiate sale");
    //   resetSaleState();
    // }
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    if (isSaleComplete) {
      resetSaleState();
    }
  };

  const showPreview = () => {
    setShowReceipt(true);
    setTimeout(() => setIsPreviewOpen(true), 100);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col space-y-4 sm:space-y-6">
      {/* Hidden receipt for printing */}
      <div
        style={{
          display: showReceipt ? "block" : "none",
          position: "absolute",
          left: "-9999px",
        }}
      >
        <div ref={receiptRef}>
          <Receipt
            cart={cart}
            totalPrice={totalPrice}
            saleId={currentSaleId}
            paymentMethod={selectedPaymentMethod || ""}
            customer={selectedCustomer}
          />
        </div>
      </div>

      {/* Modals */}
      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        cart={cart}
        totalPrice={totalPrice}
        saleId={currentSaleId}
        paymentMethod={selectedPaymentMethod || ""}
        onPrint={handlePrint}
        onDownload={downloadReceiptAsPDF}
        customer={selectedCustomer}
      />

      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        fetchCustomers={fetchCustomers}
      />

      <AnimatePresence>
        {isStepperOpen && (
          <PaymentStepper
          isOpen={isStepperOpen}
          onClose={() => setIsStepperOpen(false)}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          currentStepperStep={currentStepperStep}
          setCurrentStepperStep={setCurrentStepperStep}
          paymentQR={paymentQR}
          onPaymentConfirm={() => {
            if (selectedPaymentMethod && currentSaleId > 0) {
              confirmPayment(currentSaleId, selectedPaymentMethod);
            }
          }}
          showReceiptPreview={showPreview}
          handleAutomaticPrintAndDownload={() => {
            setShowReceipt(true);
            setTimeout(() => {
              downloadReceiptAsPDF();
              handlePrint();
              setTimeout(() => resetSaleState(), 500);
            }, 300);
          }}
          createPendingSale={createPendingSale}
          setCurrentSaleId={setCurrentSaleId}
          setPendingSale={setPendingSale}
        />
        )}
      </AnimatePresence>

      {/* Main interface */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 pb-2">
        <div className="w-full md:w-2/3">
          <ProductList
            products={products}
            onAddToCart={addToCart}
            onRefresh={loadProducts}
            isLoading={isProductsLoading}
          />
        </div>
        <div className="w-full md:w-1/3 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-md p-4 min-h-[200px] sm:min-h-[250px] flex flex-col justify-center items-center">
            <BarcodeScanner onScan={handleBarcodeScan} />
          </div>
        </div>
      </div>

      <div className="w-full bg-white rounded-lg shadow-md p-4 flex justify-between items-center mb-4">
        <div>
          <span className="font-medium">Customer: </span>
          {selectedCustomer ? (
            <span>
              {selectedCustomer.name || "No Name"} ({selectedCustomer.phone})
            </span>
          ) : (
            <span className="text-gray-500">Guest Customer</span>
          )}
        </div>
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {selectedCustomer ? "Change Customer" : "Select Customer"}
        </button>
      </div>

      <div className="w-full flex justify-end">
        <button
          onClick={handleCreateSale}
          disabled={cart.length === 0}
          className={`${
            cart.length === 0 ? "bg-gray-400" : "bg-red-900 hover:bg-red-800"
          } text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base`}
        >
          Create Sale
        </button>
      </div>

      <div className="w-full">
        <ShoppingCart
          cart={cart}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeFromCart}
          onUpdateKg={updateQuantity}
        />
      </div>

      <div className="flex flex-col md:flex-col gap-4 sm:gap-6">
        <div className="w-full md:w-2/3 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">Running Total</h2>
            <p className="text-2xl font-bold">₹{totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSInterface;
