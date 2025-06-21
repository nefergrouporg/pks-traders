import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { baseUrl } from "../../utils/services";
import Receipt from "../components/POSInterface/Receipt";
import ReceiptPreviewModal from "../components/POSInterface/ReceiptPreviewModal";
import moneyClipart from "../assets/cards_clipart.png";
import cardsClipart from "../assets/cards_clipart.png";
import { TrendingDown } from "lucide-react";
import customer from "../../../backend/models/customer";

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
  stock: number;
}

export interface Customer {
  id: number;
  name: string | null;
  phone: string;
  email?: string;
  address?: string;
  debtAmount?: number;
}

interface Sale {
  id: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
    total: number;
  }[];
  payments: Payment[];
  customerId: number | null;
  saleType: "retail" | "wholeSale" | "hotel";
  saleDate: string;
}

interface Payment {
  id?: number;
  method: "cash" | "card" | "upi" | "debt";
  amount: number;
  status?: "pending" | "completed" | "failed";
  qr?: string;
}

interface LocalPayment {
  method: "cash" | "card" | "upi" | "debt";
  amount: number;
}

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
  const [saleType, setSaleType] = useState<"retail" | "wholeSale" | "hotel">(
    "retail"
  );
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
  const [highlightedPaymentIndex, setHighlightedPaymentIndex] =
    useState<number>(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const paymentMethodsRef = useRef<HTMLDivElement>(null);
  const confirmPaymentRef = useRef<HTMLButtonElement>(null);
  const paymentReceivedRef = useRef<HTMLButtonElement>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [localPayments, setLocalPayments] = useState<LocalPayment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to current date
  const [customerSelectedIndex, setCustomerSelectedIndex] =
    useState<number>(-1);
  const token = localStorage.getItem("token");

  const paymentOptions = [
    {
      method: "cash",
      label: "Cash",
      icon: <img src={moneyClipart} alt="Cash" className="h-8 w-8" />,
    },
    {
      method: "card",
      label: "Card",
      icon: <img src={cardsClipart} alt="Card" className="h-8 w-8" />,
    },
    {
      method: "upi",
      label: "UPI",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M10.5 15.5v-7h3v7h-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
        </svg>
      ),
    },
    { method: "debt", label: "Debt", icon: <TrendingDown /> },
  ];
  const totalPaid = localPayments.reduce((sum, p) => sum + p.amount, 0);

  const availablePaymentOptions = selectedCustomer
    ? paymentOptions
    : paymentOptions.filter((option) => option.method !== "debt");

  const isCartValid = () => {
    return cart.length > 0 && cart.every((item) => item.quantity > 0);
  };

  const saleTypes: Array<"retail" | "wholeSale" | "hotel"> = [
    "retail",
    "wholeSale",
    "hotel",
  ];
  const toggleSaleType = () => {
    setSaleType((currentType) => {
      const currentIndex = saleTypes.indexOf(currentType);
      const nextIndex = (currentIndex + 1) % saleTypes.length;
      return saleTypes[nextIndex];
    });
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    const billAmount = customTotalPrice ?? totalPrice;
    const received = localPayments
      .filter((p) => p.method !== "debt")
      .reduce((sum, p) => sum + p.amount, 0);
    const newDebt =
      (selectedCustomer?.debtAmount || 0) + (billAmount - received);

    // Update selected customer state
    if (selectedCustomer) {
      const updatedCustomer = {
        ...selectedCustomer,
        debtAmount: newDebt,
      };
      setSelectedCustomer(updatedCustomer);

      // Update customers list
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === updatedCustomer.id ? updatedCustomer : c
        )
      );
    }
    if (isSaleComplete) resetSaleState();
  };

  const showReceiptPreview = () => {
    setShowReceipt(true);
    setIsPreviewOpen(true);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCustomerSearch("");
      setCustomerSearchResults([]);
      setCustomerSelectedIndex(-1); // Reset highlighted index on escape
      customerSearchRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCustomerSelectedIndex((prev) =>
        prev < customerSearchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCustomerSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && customerSelectedIndex >= 0) {
      e.preventDefault();
      const selectedCustomer = customerSearchResults[customerSelectedIndex];
      setSelectedCustomer(selectedCustomer);
      setCustomerSearch("");
      setCustomerSearchResults([]);
      setCustomerSelectedIndex(-1); // Reset highlighted index after selection
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
    setLocalPayments([]);
    setPayments([]);
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
    setHighlightedPaymentIndex(0);
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

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return toast.error("Product out of stock");
    const priceToUse =
      (saleType === "wholeSale" || saleType === "hotel") &&
      product.wholeSalePrice
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
            {
              ...product,
              price: priceToUse,
              quantity: product.unitType === "pcs" ? 1 : 0,
            },
            ...prevCart,
          ];
    });
  };

  const increaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== productId) return item;
        const increment = item.unitType === "kg" ? 0.1 : 1;
        const newQuantity = parseFloat((item.quantity + increment).toFixed(2));
        if (newQuantity > item.stock) {
          toast.error("Cannot exceed available stock for this product");
          return item;
        }
        return { ...item, quantity: newQuantity };
      })
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

  const removeFromCart = (id: number) =>
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));

  const handleBarcodeScan = async (barcodeValue: string) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/products/${barcodeValue.trim()}`
      );
      if (response.data) addToCart(response.data);
      else toast.error("Product not found!");
    } catch (error) {
      console.error("API error:", error);
      toast.error("Error scanning product");
    }
  };

  const downloadReceiptAsPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.appendChild(receiptRef.current.cloneNode(true));
      document.body.appendChild(tempDiv);

      const element = tempDiv.firstChild as HTMLElement;
      element.style.width = "80mm";
      element.style.height = "auto";

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        width: 300,
        windowWidth: 300,
      });
      document.body.removeChild(tempDiv);

      const pdfWidth = 80;
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
      pdf.save(
        `${
          selectedCustomer?.name ? selectedCustomer.name : "receipt"
        }-${currentSaleId}.pdf`
      );
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  const createSale = async () => {
    if (!isCartValid()) return toast.error("Cart is invalid");
    if (localPayments.some((p) => p.method === "debt" && !selectedCustomer))
      return toast.error("Please select a customer for debt payment");

    try {
      const saleData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        payments: localPayments,
        customerId: selectedCustomer?.id || null,
        saleType,
        ReceivedAmount: totalPaid,
        saleDate,
      };

      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.status === 201) {
        toast.success(response.data.message || "Sale created successfully");
        setCurrentSaleId(response.data.sale.id);
        setPendingSale(response.data.sale);
        const returnedPayments = response.data.sale.payments.map((p: any) => ({
          id: p.id,
          method: p.paymentMethod,
          amount: parseFloat(p.amount),
          status: p.status,
          qr: response.data.paymentQRs?.find(
            (qr: any) =>
              qr.method === "upi" && qr.amount === parseFloat(p.amount)
          )?.qr,
        }));

        setPayments(returnedPayments);
        if (returnedPayments.every((p) => p.status === "completed")) {
          setIsSaleComplete(true);
          showReceiptPreview();
        }

        loadProducts();
      } else {
        toast.error(response.data.message || "Failed to create sale");
      }
    } catch (error: any) {
      console.error("Sale creation failed:", error);
      toast.error(error.response?.data?.error || "Failed to create sale");
    }
  };

  const confirmUPIPayment = async (paymentId: number) => {
    try {
      await axios.put(
        `${baseUrl}/api/payments/${paymentId}/confirm`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPayments(
        payments.map((p) =>
          p.id === paymentId ? { ...p, status: "completed" } : p
        )
      );
      if (
        payments.every(
          (p) =>
            p.status === "completed" ||
            (p.id === paymentId && p.status === "completed")
        )
      ) {
        setIsSaleComplete(true);
        showReceiptPreview();
      }
      toast.success("UPI payment confirmed!");
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      toast.error("Failed to confirm UPI payment");
    }
  };

  const addPayment = () =>
    setLocalPayments([...localPayments, { method: "cash", amount: 0 }]);

  const removePayment = (index: number) =>
    setLocalPayments(localPayments.filter((_, i) => i !== index));

  const handleMethodChange = (index: number, method: string) => {
    const newPayments = [...localPayments];
    newPayments[index].method = method as "cash" | "card" | "upi" | "debt";
    setLocalPayments(newPayments);
  };

  const handleAmountChange = (index: number, amount: string) => {
    const newPayments = [...localPayments];
    newPayments[index].amount = parseFloat(amount) || 0;
    setLocalPayments(newPayments);
  };

  // Focus "Confirm Payment" button after selecting a non-UPI payment method
  useEffect(() => {
    if (
      selectedPaymentMethod &&
      selectedPaymentMethod !== "upi" &&
      confirmPaymentRef.current
    ) {
      confirmPaymentRef.current.focus();
    }
  }, [selectedPaymentMethod]);

  // Focus "Payment Received" button after QR code is generated for UPI
  useEffect(() => {
    if (
      selectedPaymentMethod === "upi" &&
      paymentQR &&
      paymentReceivedRef.current
    ) {
      paymentReceivedRef.current.focus();
    }
  }, [paymentQR]);

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
        case "D":
          removeFromCart(item.id);
          setCartSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "p":
        case "P":
          e.preventDefault();
          const priceInput = document.getElementById(`price-input-${item.id}`);
          if (priceInput) {
            priceInput.focus();
            (priceInput as HTMLInputElement).select();
          }
          break;
        case "q":
        case "Q":
          e.preventDefault();
          const quantityInput = document.getElementById(
            `quantity-input-${item.id}`
          );
          if (quantityInput) {
            quantityInput.focus();
            (quantityInput as HTMLInputElement).select();
          }
          break;
        case "Enter":
          if (isCartValid()) setActiveTab(2);
          else toast.error("Cart must have at least one item");
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
            saleType === "wholeSale" && item.price
              ? item.price
              : saleType === "hotel" && item.price
              ? item.price
              : product.retailPrice;
          return { ...item, price: newPrice };
        }
        return item;
      });
      setCart(updatedCart);
    }
  }, [saleType, products]);

  useEffect(() => {
    if (activeTab === 1) {
      setScanning(true);
      barcodeInputRef.current?.focus();
    } else if (activeTab === 2) {
      paymentMethodsRef.current?.focus();
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
      // Skip handling if preview modal is open
      if (isPreviewOpen) return;

      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName.toLowerCase();
      const isInputOrTextarea =
        activeTag === "input" || activeTag === "textarea";
      const isBarcodeInput = activeElement === barcodeInputRef.current;
      const isPaymentInput =
        activeElement?.className?.includes?.("payment-input");

      // Handle 'p' key for product search
      if (
        e.key === "p" &&
        activeTab === 1 &&
        (!isInputOrTextarea || isBarcodeInput)
      ) {
        e.preventDefault();
        setScanning(false);
        setBarcode("");
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
          scanTimeout.current = null;
        }
        if (productSearchRef.current) {
          productSearchRef.current.focus();
        }
        return;
      }

      // Handle 's' key for scanning
      else if (e.key === "s") {
        if (activeTab === 1) {
          setScanning((prev) => !prev);
          setBarcode("");
          if (!scanning) barcodeInputRef.current?.focus();
        }
      }

      // Only handle other keys when not focused on input/textarea
      if (!isInputOrTextarea || isPaymentInput) {
        // Navigation keys (Backspace) - skip if focused on input
        if (e.key === "Backspace" && !isInputOrTextarea) {
          e.preventDefault();
          if (activeTab === 1) {
            setActiveTab(0);
          } else if (activeTab === 2) {
            setActiveTab(1);
          }
        }

        // Submit payment with Enter
        else if (e.key === "Enter") {
          if (activeTab === 0) {
            e.preventDefault();
            setActiveTab(1);
          } else if (activeTab === 1) {
            e.preventDefault();
            if (isCartValid()) {
              setActiveTab(2);
            } else {
              toast.error(
                "Cart must have at least one item with quantity greater than zero."
              );
            }
          } else if (activeTab === 2) {
            e.preventDefault();
            const proceedButton = document.getElementById(
              "proceed-to-payment-button"
            );
            if (proceedButton && !proceedButton.hasAttribute("disabled")) {
              proceedButton.click();
            }
          }
        }

        // Other keys
        else {
          switch (e.key) {
            case "c":
              if (activeTab === 0) {
                e.preventDefault();
                if (customerSearchRef.current) {
                  customerSearchRef.current.focus();
                }
              }
              break;
            case "t":
              toggleSaleType();
              break;
            case "k":
              if (activeTab === 1) cartRef.current?.focus();
              break;
            case "a":
              if (activeTab === 2) {
                e.preventDefault();
                addPayment();
              }
              break;
            case "ArrowDown":
              if (activeTab === 2) {
                e.preventDefault();
                const inputs = document.querySelectorAll(".payment-input");
                if (inputs.length > 0) {
                  const currentIndex = Array.from(inputs).findIndex(
                    (el) => el === document.activeElement
                  );
                  const nextIndex = (currentIndex + 1) % inputs.length;
                  (inputs[nextIndex] as HTMLElement).focus();
                }
              }
              break;
            case "ArrowUp":
              if (activeTab === 2) {
                e.preventDefault();
                const inputs = document.querySelectorAll(".payment-input");
                if (inputs.length > 0) {
                  const currentIndex = Array.from(inputs).findIndex(
                    (el) => el === document.activeElement
                  );
                  const nextIndex =
                    (currentIndex - 1 + inputs.length) % inputs.length;
                  (inputs[nextIndex] as HTMLElement).focus();
                }
              }
              break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, cart, scanning, isSaleComplete, localPayments, isPreviewOpen]);

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
            payments={payments}
            customer={selectedCustomer}
            saleType={saleType}
            saleDate={saleDate}
          />
        </div>
      </div>

      <ReceiptPreviewModal
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        cart={cart}
        totalPrice={customTotalPrice ? customTotalPrice : totalPrice}
        saleId={currentSaleId}
        payments={payments} // Correct
        customer={selectedCustomer}
        saleType={saleType}
        saleDate={saleDate}
        autoDownloadPDF={true}
      />

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
              <button
                onClick={() => setSaleType("hotel")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  saleType === "hotel"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Hotel
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
                      setCustomerSelectedIndex(-1); // Reset highlighted index on click
                    }}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      index === customerSelectedIndex ? "bg-blue-100" : ""
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedCustomer(customer);
                        setCustomerSearch("");
                        setCustomerSearchResults([]);
                        setCustomerSelectedIndex(-1); // Reset highlighted index
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
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 relative">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                  P
                </kbd>
                <span>to focus search,</span>
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                  S
                </kbd>
                <span>to toggle scanning</span>
              </div>
              <div className="flex items-cente gap-4 w-full">
                {/* Search Input Container */}
                <div className="flex-1 relative">
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
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                      P
                    </kbd>
                  </span>

                  {/* Product Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product, index) => (
                          <div
                            key={product.id}
                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 ${
                              index === productSelectedIndex
                                ? "bg-blue-100"
                                : ""
                            }`}
                            onClick={() => handleSelectProduct(product)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSelectProduct(product);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {product?.name}
                              </span>
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

                {/* Barcode Scan Button Container */}
                <div className="flex-shrink-0 relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    onChange={handleBarcodeInputChange}
                    autoFocus={scanning}
                    className="absolute opacity-0"
                  />
                  <button
                    onClick={() => {
                      const newScanningState = !scanning;
                      setScanning((prev) => !prev);
                      if (newScanningState)
                        setTimeout(() => barcodeInputRef.current?.focus(), 50);
                    }}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
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
                        ? "Scanning... (Click to stop)"
                        : "Scan Barcode"}
                    </span>
                    <span className="ml-1 bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded">
                      S
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={cartRef}
            className="bg-gray-50 rounded-lg border border-gray-200 shadow-md p-4 flex flex-col h-96 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            tabIndex={0}
            onKeyDown={handleCartKeyDown}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Shopping Cart</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    saleType === "wholeSale"
                      ? "bg-purple-100 text-purple-800"
                      : saleType === "hotel"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {saleType === "wholeSale"
                    ? "Wholesale Price"
                    : saleType === "hotel"
                    ? "Hotel Price"
                    : "Retail Price"}
                </span>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                    T
                  </kbd>
                </div>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                {/* ... empty cart UI ... */}
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
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      id={`cart-item-${index}`}
                      className={`flex justify-between items-center py-3 px-2 ${
                        index === cartSelectedIndex
                          ? "bg-blue-50 rounded-md ring-2 ring-blue-300"
                          : ""
                      }`}
                    >
                      <div className="flex-1 font-medium">{item.name}</div>

                      {/* Price Field */}
                      <div className="w-24 text-center">
                        {saleType === "wholeSale" || saleType === "hotel" ? (
                          <div className="flex items-center justify-center">
                            <span className="mr-1">₹</span>
                            <input
                              id={`price-input-${item.id}`}
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice) && newPrice >= 0) {
                                  setCart((prevCart) =>
                                    prevCart.map((cartItem) =>
                                      cartItem.id === item.id
                                        ? { ...cartItem, price: newPrice }
                                        : cartItem
                                    )
                                  );
                                }
                              }}
                              className="w-16 text-center border rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step={0.01}
                              min={0}
                            />
                          </div>
                        ) : (
                          <span>₹{item.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="w-32 text-center">
                        {item.unitType === "kg" ? (
                          <div className="relative">
                            <input
                              id={`quantity-input-${item.id}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                let newQuantity =
                                  parseFloat(e.target.value) || 0;
                                if (newQuantity > item.stock) {
                                  toast.error("Quantity exceeds stock limit");
                                  newQuantity = 0;
                                }
                                updateQuantity(item.id, newQuantity);
                              }}
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
                              className="w-8 h-8 rounded-l-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              title="Decrease quantity (-)"
                            >
                              -
                            </button>
                            <span className="w-12 text-center py-1 border-t border-b">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              className="w-8 h-8 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              title="Increase quantity (+)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-24 text-right font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="w-16 text-right">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-150 rounded-full hover:bg-red-50"
                          title="Remove item (D)"
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
                  ))}
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
                        if (isCartValid()) setActiveTab(2);
                        else
                          toast.error(
                            "Cart must have at least one item with quantity greater than zero."
                          );
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
                      Checkout <span className="ml-1 text-xs">(Enter)</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 bg-blue-50 p-2 rounded-md text-xs text-blue-700">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        K
                      </kbd>
                      Focus cart
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        ↑
                      </kbd>
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        ↓
                      </kbd>
                      Navigate items
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        +
                      </kbd>
                      Increase quantity
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        -
                      </kbd>
                      Decrease quantity
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        D
                      </kbd>
                      Remove item
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        P
                      </kbd>
                      Edit price
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        Q
                      </kbd>
                      Edit quantity
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        T
                      </kbd>
                      Toggle sale type
                    </div>
                    <div className="flex items-center">
                      <kbd className="mr-1 px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                        Enter
                      </kbd>
                      Checkout
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100 overflow-auto">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">Sale Summary</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">
              {saleType}
            </span>
          </div>

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

          <div className="mb-6">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Order Details
              </h3>
              {isEditingDate ? (
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  onBlur={() => setIsEditingDate(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingDate(false)
                  }
                  className="text-gray-500 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span
                  className="text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => setIsEditingDate(true)}
                >
                  {new Date(saleDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
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
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 grid grid-cols-12">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-3 text-center">Quantity</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>
                <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
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

          <div className="space-y-4">
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-xl font-bold text-gray-800">
                ₹
                {customTotalPrice
                  ? customTotalPrice.toFixed(2)
                  : totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Payment Methods</h3>
              <div className="space-y-4">
                {localPayments.map((payment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <select
                        value={payment.method}
                        onChange={(e) =>
                          handleMethodChange(index, e.target.value)
                        }
                        className="border rounded px-2 py-1 payment-input"
                      >
                        {availablePaymentOptions.map((option) => (
                          <option key={option.method} value={option.method}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-500 ml-1 mt-0.5">
                        ⬅️ ➡️ change payment methods
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) =>
                          handleAmountChange(index, e.target.value)
                        }
                        className="border rounded px-2 py-1 w-24 payment-input"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-[10px] text-gray-500 ml-1 mt-0.5">
                        🔼 🔽 change fields
                      </span>
                    </div>

                    <button
                      onClick={() => removePayment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={addPayment}
                  className="px-4 py-2 text-sm font-medium text-blue-600 transition duration-200 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                >
                  + Add Payment Method{" "}
                  <span className="text-xs text-gray-500">(or press 'a')</span>
                </button>
              </div>
              <div className="mt-2">
                <p>Total Paid: ₹{totalPaid.toFixed(2)}</p>
                {selectedCustomer === null ? (
                  <p
                    className={
                      totalPaid === totalPrice
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {totalPaid === totalPrice
                      ? "Payment matches total"
                      : "Payment does not match total"}
                  </p>
                ) : (
                  <p
                    className={
                      totalPaid === totalPrice
                        ? "text-green-500"
                        : totalPaid < totalPrice
                        ? "text-orange-500"
                        : "text-blue-500"
                    }
                  >
                    {totalPaid === totalPrice
                      ? "Payment matches total"
                      : totalPaid < totalPrice
                      ? `Remaining to pay: ₹${(totalPrice - totalPaid).toFixed(
                          2
                        )}`
                      : `Overpayment: ₹${(totalPaid - totalPrice).toFixed(2)}`}
                  </p>
                )}
              </div>
            </div>

            {localPayments.length > 0 && (
              <button
                id="proceed-to-payment-button"
                onClick={createSale}
                disabled={
                  !isCartValid() ||
                  (selectedCustomer === null && totalPaid !== totalPrice)
                }
                className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Proceed to Payment
              </button>
            )}

            {payments.some(
              (p) => p.status === "pending" && p.method === "upi"
            ) && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">
                  Confirm UPI Payments
                </h4>
                {payments
                  .filter((p) => p.status === "pending" && p.method === "upi")
                  .map((payment) => (
                    <div key={payment.id} className="text-center mb-4">
                      <p>Amount: ₹{payment.amount.toFixed(2)}</p>
                      <img
                        src={payment.qr}
                        alt="QR Code"
                        className="mx-auto h-40 w-40 border-2 border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => confirmUPIPayment(payment.id!)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Payment Received
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default POSInterface;
