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

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
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
  const [cart, setCart] = useState<
    Array<{
      id: number;
      name: string;
      retailPrice: number;
      wholeSalePrice?: number;
      quantity: number;
      unitType: "pcs" | "kg";
      price: number;
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [currentStepperStep, setCurrentStepperStep] = useState(1);
  const [saleType, setSaleType] = useState<"retail" | "wholeSale">("retail");

  // BarcodeScanner states
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  // ProductSearch states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSelectedIndex, setProductSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const productSearchRef = useRef<HTMLInputElement>(null);

  // ShoppingCart states
  const [cartSelectedIndex, setCartSelectedIndex] = useState(-1);
  const cartRef = useRef<HTMLDivElement>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const createSaleButtonRef = useRef<HTMLButtonElement>(null);
  const saleTypeCheckboxRef = useRef<HTMLInputElement>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);

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
  };

  const token = localStorage.getItem("token");

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

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onBeforeGetContent: () =>
      new Promise<void>((resolve) => {
        setShowReceipt(true);
        setTimeout(() => resolve(), 100);
      }),
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm" });
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

  const createPendingSale = async (method: "cash" | "card" | "upi") => {
    try {
      const saleData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: method.toLowerCase(),
        customerId: selectedCustomer?.id || null,
        saleType,
      };
      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: { Authorization: `Bearer ${token}` },
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
      }
    } catch (error) {
      console.error("Sale creation failed:", error);
      toast.error(error.response?.data?.error || "Failed to create sale");
      throw error;
    }
  };

  const confirmPayment = async (
    saleId: number,
    paymentMethod: "cash" | "card" | "upi"
  ) => {
    try {
      await axios.post(`${baseUrl}/api/payments/confirm`, { saleId });
      toast.success("Payment confirmed!");
      setIsSaleComplete(true);
      if (paymentMethod === "cash") {
        setTimeout(() => {
          downloadReceiptAsPDF();
          handlePrint();
          resetSaleState();
        }, 300);
      } else if (paymentMethod === "upi") {
        downloadReceiptAsPDF();
        handlePrint();
        setIsStepperOpen(true);
        setCurrentStepperStep(2);
        resetSaleState();
      } else {
        showPreview();
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
    setIsStepperOpen(true);
    setCurrentStepperStep(1);
    setSelectedPaymentMethod(undefined);
    setPaymentQR(null);
    setIsSaleComplete(false);
    setPendingSale(null);
  };

  // BarcodeScanner logic
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scannedCode = e.target.value;
    setBarcode(scannedCode);
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }
    scanTimeout.current = setTimeout(() => {
      if (scannedCode) {
        handleBarcodeScan(scannedCode);
        e.target.value = "";
        setBarcode("");
      }
    }, 100);
  };

  useEffect(() => {
    if (scanning) {
      barcodeInputRef.current?.focus();
    }
  }, [scanning]);

  // ProductSearch logic
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode.includes(searchTerm)
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

  // ShoppingCart logic
  const handleCartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCartSelectedIndex((prev) => Math.min(prev + 1, cart.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCartSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (cartSelectedIndex >= 0) {
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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (scanning) {
          setScanning(false);
          setBarcode("");
          barcodeInputRef.current?.blur();
        } else if (document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur();
        }
      } else {
        const activeElement = document.activeElement?.tagName.toLowerCase();
        if (activeElement !== "input" && activeElement !== "textarea") {
          switch (e.key) {
            case "s":
              setScanning((prev) => !prev);
              setBarcode("");
              if (!scanning) {
                barcodeInputRef.current?.focus();
              }
              break;
            case "p":
              productSearchRef.current?.focus();
              break;
            case "c":
              customerSearchRef.current?.focus();
              break;
            case "t":
              toggleSaleType();
              break;
            case "k":
              cartRef.current?.focus();
              break;
            case "Enter":
              if (document.activeElement === createSaleButtonRef.current) {
                handleCreateSale();
              }
              break;
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [scanning, toggleSaleType, handleCreateSale]);

  // Scroll selected cart item into view
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
    <div className="sm:px-4 mt-10 max-h-screen flex flex-col space-y-2 sm:space-y-1 overflow-hidden">
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
            saleType={saleType}
          />
        </div>
      </div>

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

      <div className="relative">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-lg shadow-md p-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Sale Type:</span>
            <div className="relative inline-block w-16 align-middle select-none">
              <input
                type="checkbox"
                name="saleType"
                id="saleType"
                className="sr-only"
                checked={saleType === "wholeSale"}
                onChange={toggleSaleType}
                ref={saleTypeCheckboxRef}
              />
              <label
                htmlFor="saleType"
                className={`block overflow-hidden h-6 rounded-full cursor-pointer 
                ${saleType === "wholeSale" ? "bg-blue-500" : "bg-gray-300"}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in
                  ${
                    saleType === "wholeSale"
                      ? "translate-x-10"
                      : "translate-x-0"
                  }`}
                />
              </label>
            </div>
            <span
              className={`font-bold ${
                saleType === "wholeSale" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {saleType === "retail" ? "Retail" : "Wholesale"}
            </span>
            <span className="text-sm text-gray-500 ml-2">(T to toggle)</span>
          </div>

          <div className="flex-1 w-full md:w-auto relative">
            <input
              ref={productSearchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleProductKeyDown}
              placeholder="Search products by name or barcode"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        index === productSelectedIndex ? "bg-gray-200" : ""
                      }`}
                      onClick={() => handleSelectProduct(product)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSelectProduct(product);
                      }}
                    >
                      <div className="flex justify-between">
                        <span>{product.name}</span>
                        <span>
                          ₹
                          {(saleType === "wholeSale" && product.wholeSalePrice
                            ? product.wholeSalePrice
                            : product.retailPrice
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.stock} {product.unitType}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-center">
                    No results found
                  </div>
                )}
              </div>
            )}
            <span className="text-sm text-gray-500 ml-2">(P to focus)</span>
          </div>

          <div className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              onChange={handleBarcodeInputChange}
              autoFocus={scanning}
              className="absolute opacity-0 pointer-events-none"
            />
            <button
              onClick={() => {
                setScanning((prev) => !prev);
                setBarcode("");
                if (!scanning) {
                  barcodeInputRef.current?.focus();
                }
              }}
              className={`w-32 px-4 py-2 rounded-md transition-all duration-300 
    ${
      scanning ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
    } 
    text-white text-sm`}
            >
              {scanning ? "Stop Scanning" : "Start Scanning"}
            </button>
          </div>

          <button
            onClick={handleCreateSale}
            disabled={cart.length === 0}
            ref={createSaleButtonRef}
            className={`text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base
            ${
              cart.length === 0 ? "bg-gray-400" : "bg-red-900 hover:bg-red-800"
            }`}
          >
            Create Sale (Enter when focused)
          </button>
        </div>
      </div>

      <div className="w-full bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="w-full sm:w-auto text-center sm:text-left">
          <span className="font-medium">Customer: </span>
          {selectedCustomer ? (
            <span>
              {selectedCustomer?.name || "No Name"} ({selectedCustomer?.phone})
            </span>
          ) : (
            <span className="text-gray-500">Guest Customer</span>
          )}
        </div>

        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => handleCustomerSearch(e.target.value)}
            onKeyDown={handleCustomerKeyDown}
            placeholder="Search customer..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref={customerSearchRef}
          />
          <span className="text-sm text-gray-500 absolute right-2 top-2">
            (C to focus)
          </span>
          {customerSearchResults.length > 0 && (
            <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {customerSearchResults.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerSearch("");
                    setCustomerSearchResults([]);
                  }}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    index === 0 ? "bg-gray-200" : ""
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
                  <div className="font-medium">
                    {customer.name || "No Name"}
                  </div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex-1">
        <div
          ref={cartRef}
          className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full focus:outline-none"
          tabIndex={0}
          onKeyDown={handleCartKeyDown}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Shopping Cart</h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {saleType === "wholeSale"
                ? "Wholesale Pricing"
                : "Retail Pricing"}
            </span>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8 flex-1">
              Your cart is empty. Add products to get started.
            </p>
          ) : (
            <>
              <div className="flex justify-between text-sm font-semibold border-b pb-2">
                <div className="flex-1">Item</div>
                <div className="w-24 text-center">Price</div>
                <div className="w-96 text-center">Quantity</div>
                <div className="w-24 text-right">Total</div>
                <div className="w-24 text-right"></div>
                <div className="w-9"></div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y">
                {cart.map((item, index) => {
                  const price =
                    saleType === "wholeSale" && item.wholeSalePrice
                      ? item.wholeSalePrice
                      : item.retailPrice;
                  return (
                    <div
                      key={item.id}
                      id={`cart-item-${index}`}
                      className={`flex justify-between items-center py-2 ${
                        index === cartSelectedIndex ? "bg-blue-100" : ""
                      }`}
                    >
                      <div className="flex-1">{item.name}</div>
                      <div className="w-24 text-center">
                        ₹{price.toFixed(2)}
                      </div>
                      <div className="w-96 text-center">
                        {item.unitType === "kg" ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center border rounded"
                          />
                        ) : (
                          <div>
                            <button onClick={() => decreaseQuantity(item.id)}>
                              -
                            </button>
                            <span className="mx-2">{item.quantity}</span>
                            <button onClick={() => increaseQuantity(item.id)}>
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-24 text-right">
                        ₹{(price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-gray-600">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                (K to focus, Arrow keys to navigate, + to increase, - to
                decrease, D to remove)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSInterface;
