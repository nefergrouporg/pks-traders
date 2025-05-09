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
import PaymentStepper from "../components/POSInterface/PaymentStepper";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface Product {
  id: number;
  name: string;
  description: string;
  retailPrice: number;
  wholeSalePrice?: number;
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

interface CartItem {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice?: number;
  quantity: number;
  unitType: "pcs" | "kg";
  price: number;
}

export interface Customer {
  id: number;
  name: string | null;
  phone: string;
  email?: string;
  address?: string;
}

interface Sale {
  id: number;
  items: { productId: number; quantity: number }[];
  paymentMethod: string;
  customerId: number | null;
  saleType: "retail" | "wholeSale";
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) modalRef.current?.focus();
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={modalRef}
    >
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <button
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
        >
          × (Esc to close)
        </button>
        {children}
      </div>
    </div>
  );
};

const POSInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [currentSaleId, setCurrentSaleId] = useState<number>(-1);
  const [isSaleComplete, setIsSaleComplete] = useState<boolean>(false);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "card" | "upi" | "debt" | undefined
  >(undefined);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isStepperOpen, setIsStepperOpen] = useState<boolean>(false);
  const [currentStepperStep, setCurrentStepperStep] = useState<number>(1);
  const [saleType, setSaleType] = useState<"retail" | "wholeSale">("retail");
  const [barcode, setBarcode] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSelectedIndex, setProductSelectedIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [cartSelectedIndex, setCartSelectedIndex] = useState<number>(-1);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    Customer[]
  >([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  const isCartValid = () => {
    return cart.length > 0 && cart.every((item) => item.quantity > 0);
  };

  const toggleSaleType = () => {
    setSaleType((currentType) =>
      currentType === "retail" ? "wholeSale" : "retail"
    );
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    if (isSaleComplete) resetSaleState();
  };

  const showPreview = () => {
    setShowReceipt(true);
    setIsPreviewOpen(true);
  };

  const handleCancelOrder = () => {
    setIsStepperOpen(false);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCustomerSearch("");
      setCustomerSearchResults([]);
      customerSearchRef.current?.blur();
    }
  };

  const handleCustomerSearch = (term: string) => {
    setCustomerSearch(term);
    if (!term.trim()) {
      setCustomerSearchResults([]);
      return;
    }
    const filtered = customers.filter(
      (customer) =>
        customer.phone.includes(term) ||
        (customer.name &&
          customer.name.toLowerCase().includes(term.toLowerCase()))
    );
    setCustomerSearchResults(filtered);
  };

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
    setSaleType("retail");
    setScanning(false);
    setBarcode("");
    setSearchTerm("");
    setFilteredProducts([]);
    setProductSelectedIndex(-1);
    setIsDropdownOpen(false);
    setCartSelectedIndex(-1);
    setActiveTab(0);
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const addToCart = (product: {
    id: number;
    name: string;
    retailPrice: number;
    wholeSalePrice?: number;
    unitType: "pcs" | "kg";
  }) => {
    const priceToUse =
      saleType === "wholeSale" && product.wholeSalePrice
        ? product.wholeSalePrice
        : product.retailPrice;
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
            {
              ...product,
              price: priceToUse,
              quantity: product.unitType === "pcs" ? 1 : 0,
            },
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

  const handleBarcodeScan = async (barcodeValue: string) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/products/${barcodeValue.trim()}`
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

  const handlePrint = () => {
    downloadReceiptAsPDF();
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // optional: reload to reset page if needed
  };

  // const handlePrint = useReactToPrint({
  //   content: () => receiptRef.current,
  //   onBeforeGetContent: () =>
  //     new Promise<void>((resolve) => {
  //       setShowReceipt(true);
  //       setTimeout(() => resolve(), 100);
  //     }),
  //   removeAfterPrint: false,
  // });

  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.appendChild(receiptRef.current.cloneNode(true));
      document.body.appendChild(tempDiv);

      const element = tempDiv.firstChild as HTMLElement;

      // Set fixed width and natural height
      element.style.width = "80mm"; // Standard thermal printer width
      element.style.height = "auto";

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        width: 300, // 80mm equivalent in pixels
        windowWidth: 300,
      });

      document.body.removeChild(tempDiv);

      // Calculate PDF dimensions
      const pdfWidth = 80; // mm
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

      pdf.save(`receipt-${currentSaleId}.pdf`);
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  const createPendingSale = async (
    method: "cash" | "card" | "upi" | "debt"
  ) => {
    try {
      if (method === "debt" && selectedCustomer?.id === null) {
        toast.error("Please select a customer for debt payment.");
        return;
      }

      const finalAmount =
        saleType === "wholeSale" && customTotalPrice !== null
          ? customTotalPrice
          : totalPrice;

      const saleData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: method.toLowerCase(),
        customerId: selectedCustomer?.id || null,
        saleType,
        finalAmount: finalAmount, // Add this line
      };

      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10-second timeout
      });

      if (response.status === 201) {
        toast.success(response.data.message || "Sale created successfully");
        setCurrentSaleId(response.data.sale.id);
        setPendingSale(response.data.sale);
        if (method === "upi" && response.data.paymentQR) {
          setPaymentQR(response.data.paymentQR);
          setIsStepperOpen(true);
          setCurrentStepperStep(2);
        } else {
          await confirmPayment(response.data.sale.id, method);
        }
        loadProducts();
        return { sale: response.data.sale, paymentQR: response.data.paymentQR };
      } else {
        toast.error(response.data.message || "Failed to create sale");
        return null;
      }
    } catch (error: any) {
      console.error("Sale creation failed:", error);
      toast.error(error.response?.data?.error || "Failed to create sale");
      throw error;
    }
  };

  const confirmPayment = async (
    saleId: number,
    paymentMethod: "cash" | "card" | "upi" | "debt"
  ) => {
    try {
      await axios.post(`${baseUrl}/api/payments/confirm`, { saleId });
      toast.success("Payment confirmed!");
      setIsSaleComplete(true);

      await new Promise((resolve) => setTimeout(resolve, 300));
      // Always download PDF regardless of payment method
      // setTimeout(() => {
      downloadReceiptAsPDF();
      // handlePrint();
      // }, 300);

      setShowReceipt(true);
      setIsPreviewOpen(true);

      if (paymentMethod === "upi") {
        setIsStepperOpen(true);
        setCurrentStepperStep(2);
      }

      // resetSaleState();
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      toast.error("Failed to confirm payment. Please try again.");
      setIsStepperOpen(true);
    }
  };

  const handleCreateSale = async () => {
    if (!isCartValid()) {
      toast.error("Cannot create sale with empty or invalid cart");
      return;
    }
    setIsStepperOpen(true);
    setCurrentStepperStep(1);
    setSelectedPaymentMethod(undefined);
    setPaymentQR(null);
    setIsSaleComplete(false);
    setPendingSale(null);
  };

  const scanningRef = useRef(scanning);
  useEffect(() => {
    scanningRef.current = scanning;
    if (scanning) {
      barcodeInputRef.current?.focus();
    }
  }, []);
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!scanningRef.current) return;

    const scannedCode = e.target.value;
    setBarcode(scannedCode);

    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    scanTimeout.current = setTimeout(() => {
      if (scannedCode) {
        handleBarcodeScan(scannedCode);
        e.target.value = "";
        setBarcode("");
      }
    }, 100);
  };

  useEffect(() => {
    if (scanning) barcodeInputRef.current?.focus();
  }, [scanning]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.barcode?.includes(searchTerm)
      );
      setFilteredProducts(filtered);
      setIsDropdownOpen(true);
      setProductSelectedIndex(-1);
    } else {
      setFilteredProducts([]);
      setIsDropdownOpen(false);
    }
  }, [searchTerm, products]);

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchTerm("");
      setIsDropdownOpen(false);
      productSearchRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setProductSelectedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setProductSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && productSelectedIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(filteredProducts[productSelectedIndex]);
    }
  };

  const handleSelectProduct = (product: Product) => {
    addToCart(product);
    setSearchTerm("");
    setIsDropdownOpen(false);
    setProductSelectedIndex(-1);
    productSearchRef.current?.focus();
  };

  const handleCartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCartSelectedIndex((prev) => Math.min(prev + 1, cart.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCartSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (cartSelectedIndex >= 0 && cartSelectedIndex < cart.length) {
      const item = cart[cartSelectedIndex];
      switch (e.key) {
        case "+":
          increaseQuantity(item.id);
          break;
        case "-":
          decreaseQuantity(item.id);
          break;
        case "d":
          removeFromCart(item.id);
          setCartSelectedIndex((prev) =>
            prev >= cart.length - 1 ? prev - 1 : prev
          );
          break;
      }
    }
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => {
    const price =
      saleType === "wholeSale" && item.wholeSalePrice
        ? item.wholeSalePrice
        : item.retailPrice;
    return total + price * item.quantity;
  }, 0);

  useEffect(() => {
    fetchCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (cart.length > 0 && products.length > 0) {
      const updatedCart = cart.map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const newPrice =
            saleType === "wholeSale" && product.wholeSalePrice
              ? product.wholeSalePrice
              : product.retailPrice;
          return { ...item, price: newPrice };
        }
        return item;
      });
      setCart(updatedCart);
    }
  }, [saleType, products]);

  useEffect(() => {
    // Start scanning when tab 1 becomes active
    if (activeTab === 1) {
      setScanning(true);
      barcodeInputRef.current?.focus();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        scanningRef.current &&
        !barcodeInputRef.current?.contains(e.target as Node)
      ) {
        setScanning(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const activeElement = document.activeElement?.tagName.toLowerCase();
      if (activeElement !== "input" && activeElement !== "textarea") {
        if (scanning) {
          setScanning(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (activeTab === 0) {
            setActiveTab(1);
          } else if (activeTab === 1) {
            if (isCartValid()) {
              setActiveTab(2);
            } else {
              toast.error(
                "Cart must have at least one item with quantity greater than zero."
              );
            }
          } else if (activeTab === 2) {
            handleCreateSale();
          }
        } else if (e.key === "Backspace") {
          e.preventDefault();
          if (activeTab === 1) {
            setActiveTab(0);
          } else if (activeTab === 2) {
            setActiveTab(1);
          }
        } else {
          switch (e.key) {
            case "s":
              if (activeTab === 1) {
                setScanning((prev) => !prev);
                setBarcode("");
                if (!scanning) barcodeInputRef.current?.focus();
              }
              break;
            case "p":
              if (activeTab === 1) productSearchRef.current?.focus();
              break;
            case "c":
              if (activeTab === 0) customerSearchRef.current?.focus();
              break;
            case "t":
              toggleSaleType();
              break;
            case "k":
              if (activeTab === 1) cartRef.current?.focus();
              break;
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, cart, scanning]);

  useEffect(() => {
    if (cartSelectedIndex >= 0 && cartSelectedIndex < cart.length) {
      const selectedItem = document.getElementById(
        `cart-item-${cartSelectedIndex}`
      );
      if (selectedItem) {
        selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [cartSelectedIndex]);

  return (
    <div className="sm:px-4 mt-10 max-h-screen flex flex-col space-y-4 overflow-hidden">
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
            totalPrice={customTotalPrice ? customTotalPrice : totalPrice}
            saleId={currentSaleId}
            paymentMethod={selectedPaymentMethod || ""}
            customer={selectedCustomer}
            saleType={saleType}
          />
        </div>
      </div>

      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        cart={cart}
        totalPrice={customTotalPrice ? customTotalPrice : totalPrice}
        saleId={currentSaleId}
        paymentMethod={selectedPaymentMethod || ""}
        onPrint={handlePrint}
        onDownload={downloadReceiptAsPDF}
        customer={selectedCustomer}
        saleType={saleType}
      />
      <AnimatePresence>
        {isStepperOpen && (
          <PaymentStepper
            isOpen={isStepperOpen}
            onClose={handleCancelOrder}
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
                // downloadReceiptAsPDF();
                // handlePrint();
                setTimeout(() => resetSaleState(), 500);
              }, 300);
            }}
            createPendingSale={createPendingSale}
            setCurrentSaleId={setCurrentSaleId}
            setPendingSale={setPendingSale}
            selectedCustomer={selectedCustomer}
            paymentMethod={selectedPaymentMethod}
          />
        )}
      </AnimatePresence>

      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${
            activeTab === 0
              ? "bg-blue-600 text-white border-b-2 border-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Sale Setup
        </button>
        <button
          className={`px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${
            activeTab === 1
              ? "bg-blue-600 text-white border-b-2 border-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Products & Cart
        </button>
        <button
          className={`px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${
            activeTab === 2
              ? "bg-blue-600 text-white border-b-2 border-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Payment
        </button>
      </div>

      {activeTab === 0 && (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
          {/* Sale Type Toggle Section */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Sale Type:
            </span>
            <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setSaleType("retail")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  saleType === "retail"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Retail
              </button>
              <button
                onClick={() => setSaleType("wholeSale")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  saleType === "wholeSale"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Wholesale
              </button>
            </div>
            <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                T
              </kbd>
            </div>
          </div>

          {/* Customer Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Customer</h3>
              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Customer Display Card */}
            {selectedCustomer ? (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || "G"}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-800">
                    {selectedCustomer.name || "Guest Customer"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedCustomer.phone}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  G
                </div>
                <div className="ml-3">
                  <div className="font-medium">Guest Customer</div>
                  <div className="text-sm">No account information</div>
                </div>
              </div>
            )}

            {/* Customer Search */}
            <div className="relative mt-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onKeyDown={handleCustomerKeyDown}
                placeholder="Search customer by name or phone"
                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ref={customerSearchRef}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                    C
                  </kbd>
                </div>
              </div>
            </div>

            {/* Customer Search Results */}
            {customerSearchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {customerSearchResults.map((customer, index) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearch("");
                      setCustomerSearchResults([]);
                    }}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      index === 0 ? "bg-gray-50" : ""
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedCustomer(customer);
                        setCustomerSearch("");
                        setCustomerSearchResults([]);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">
                        {customer.name?.charAt(0).toUpperCase() || "G"}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-800">
                          {customer.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setActiveTab(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
          {/* Search and Barcode Section */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Product Search */}
            <div className="flex-1 relative">
              <div className="relative">
                <input
                  ref={productSearchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleProductKeyDown}
                  placeholder="Search products by name or barcode"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                  Press P to focus
                </span>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 ${
                          index === productSelectedIndex ? "bg-blue-100" : ""
                        }`}
                        onClick={() => handleSelectProduct(product)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSelectProduct(product);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{product?.name}</span>
                          <span className="font-semibold text-blue-700">
                            ₹
                            {(saleType === "wholeSale" &&
                            product?.wholeSalePrice
                              ? product?.wholeSalePrice
                              : product?.retailPrice
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center">
                          <span
                            className={`mr-2 inline-block h-2 w-2 rounded-full ${
                              product?.stock > 10
                                ? "bg-green-500"
                                : product?.stock > 0
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          <span>
                            {product?.stock} {product?.unitType}{" "}
                            {product?.stock <= 5 && product?.stock > 0
                              ? "(Low Stock)"
                              : product?.stock === 0
                              ? "(Out of Stock)"
                              : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barcode Scanner */}
            <div className="flex-shrink-0">
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  onChange={handleBarcodeInputChange}
                  autoFocus={scanning}
                  // disabled={!scanning}
                  className="absolute opacity-0"
                />
                <button
                  onClick={() => {
                    const newScanningState = !scanning;
                    setScanning((prev) => !prev);
                    if (newScanningState) {
                      setTimeout(() => {
                        barcodeInputRef.current?.focus();
                      }, 50);
                    }
                  }}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    scanning
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    ></path>
                  </svg>
                  <span>
                    {scanning
                      ? "Scanning... (Click anywhere to stop)"
                      : "Scan Barcode"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Shopping Cart Section */}
          <div
            ref={cartRef}
            className="bg-gray-50 rounded-lg border border-gray-200 shadow-md p-4 flex flex-col h-96 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            tabIndex={0}
            onKeyDown={handleCartKeyDown}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Shopping Cart</h2>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  saleType === "wholeSale"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {saleType === "wholeSale" ? "Wholesale Price" : "Retail Price"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <svg
                  className="w-16 h-16 mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <p className="text-center">
                  Your cart is empty. Add products to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm font-semibold text-gray-600 border-b pb-2 px-2">
                  <div className="flex-1">Item</div>
                  <div className="w-24 text-center">Price</div>
                  <div className="w-32 text-center">Quantity</div>
                  <div className="w-24 text-right">Total</div>
                  <div className="w-16 text-right"></div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-32">
                  {cart.map((item, index) => {
                    const price =
                      saleType === "wholeSale" && item.wholeSalePrice
                        ? item.wholeSalePrice
                        : item.retailPrice;
                    return (
                      <div
                        key={item.id}
                        id={`cart-item-${index}`}
                        className={`flex justify-between items-center py-3 px-2 ${
                          index === cartSelectedIndex
                            ? "bg-blue-50 rounded-md"
                            : ""
                        }`}
                      >
                        <div className="flex-1 font-medium">{item.name}</div>
                        <div className="w-24 text-center">
                          ₹{price.toFixed(2)}
                        </div>
                        <div className="w-32 text-center">
                          {item.unitType === "kg" ? (
                            <div className="relative">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center border rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                step={0.1}
                                min={0}
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                                kg
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => decreaseQuantity(item.id)}
                                className="w-8 h-8 rounded-l-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center focus:outline-none"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M20 12H4"
                                  ></path>
                                </svg>
                              </button>
                              <span className="w-12 text-center py-1 border-t border-b">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => increaseQuantity(item.id)}
                                className="w-8 h-8 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center focus:outline-none"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                  ></path>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="w-24 text-right font-semibold">
                          ₹{(price * item.quantity).toFixed(2)}
                        </div>
                        <div className="w-16 text-right">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-150 rounded-full hover:bg-red-50"
                            title="Remove item"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-gray-800">
                      ₹
                      {(saleType === "wholeSale" && customTotalPrice !== null
                        ? customTotalPrice
                        : totalPrice
                      )?.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        if (isCartValid()) {
                          setActiveTab(2);
                        } else {
                          toast.error(
                            "Cart must have at least one item with quantity greater than zero."
                          );
                        }
                      }}
                      disabled={!isCartValid()}
                      className={`px-6 py-2 rounded-lg transition-colors duration-150 flex items-center ${
                        isCartValid()
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        ></path>
                      </svg>
                      Checkout
                    </button>
                  </div>
                </div>

                <div className="mt-3 bg-blue-50 p-2 rounded-md text-xs text-blue-700 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    Press K to focus cart, arrow keys to navigate, + or - to
                    adjust quantity, D to remove item
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">Sale Summary</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">
              {saleType}
            </span>
          </div>

          {/* Customer Info Card */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-gray-800">
                  {selectedCustomer
                    ? `${selectedCustomer.name || "No Name"}`
                    : "Guest Customer"}
                </p>
                {selectedCustomer?.phone && (
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Order Details
            </h3>
            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-gray-500">No items in cart</p>
                <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                  Add Products
                </button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 grid grid-cols-12">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-3 text-center">Quantity</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 grid grid-cols-12 items-center text-sm"
                    >
                      <span className="col-span-6 font-medium text-gray-800">
                        {item.name}
                      </span>
                      <span className="col-span-3 text-center text-gray-600">
                        {item.quantity} {item.unitType}
                      </span>
                      <span className="col-span-3 text-right font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {saleType === "wholeSale" && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Calculated Total</p>
                  <p className="text-lg font-semibold text-blue-700">
                    ₹{totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="text-sm text-gray-600 mb-1 block">
                    Final Price
                    <span className="text-xs text-gray-500 ml-2">
                      (negotiable)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={customTotalPrice ? customTotalPrice : totalPrice}
                    onChange={(e) =>
                      setCustomTotalPrice(Number(e.target.value))
                    }
                    className="w-full text-lg font-semibold bg-transparent focus:outline-none"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                * Adjust final price for wholesale customers as needed
              </p>
            </div>
          )}

          {/* Total and Payment Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-xl font-bold text-gray-800">
                ₹
                {customTotalPrice
                  ? customTotalPrice?.toFixed(2)
                  : totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCreateSale}
              disabled={!isCartValid()}
              className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors duration-200 flex items-center justify-center ${
                isCartValid()
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isCartValid() ? "Proceed to Payment" : "Add Items to Continue"}
              {isCartValid() && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSInterface;
