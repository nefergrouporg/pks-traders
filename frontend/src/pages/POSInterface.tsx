import axios from "axios";
import React, { useEffect, useState } from "react";
import BarcodeScanner from "../components/POSInterface/BarcodeScanner";
import { baseUrl } from "../../utils/services";
import ProductList from "../components/POSInterface/ProductList";
import ShoppingCart from "../components/POSInterface/ShoppingCart";
import { toast } from "sonner";
import Stepper, { Step } from "../components/Stepper";
import { motion, AnimatePresence } from "framer-motion";
import moneyClipart from '../assets/money_clipart.png';
import cardsClipart from "../assets/cards_clipart.png";

// Reusable Modal Component
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
  createdAt: string; // or Date if you want to parse it
  updatedAt: string; // or Date if you want to parse it
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// POS Interface Page
const POSInterface: React.FC = () => {
  const [cart, setCart] = useState<
    {
      id: number;
      name: string;
      price: number;
      quantity: number;
      unitType: "pcs" | "kg";
    }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">(
    "cash"
  );
  const [discountCode, setDiscountCode] = useState("");
  const [isSplitBillingModalOpen, setIsSplitBillingModalOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(150);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState(-1);

  // Fetch products on mount
  const loadProducts = async () => {
    setIsProductsLoading(true);

    const fetchPromise = axios.get(`${baseUrl}/api/products`);
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const response = await fetchPromise;
      await delayPromise;
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  // Remove item from cart
  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Calculate total price
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/products/${barcode.trim()}`
      );
      addToCart(response.data);
    } catch (error) {
      console.error("API error:", error);
      alert("Product not found!");
    }
  };

  // Process payment
  const processPayment = async (method: "cash" | "card" | "upi") => {
    try {
      const validationErrors = await validateSale();

      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => toast.error(error));
        return;
      }
      const token = localStorage.getItem("token");
      const saleData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: method,
        customerId: "CUST-123",
      };

      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setCurrentSaleId(response?.data.sale?.id);

      if (method === "upi") {
        setPaymentQR(response.data.paymentQR);
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(error?.response?.data?.error || "Something went wrong");
    }
  };

  // Apply discount (placeholder logic)
  const applyDiscount = () => {
    alert(`Discount code "${discountCode}" applied!`);
  };

  // Split billing (placeholder logic)
  const handleSplitBilling = () => {
    setIsSplitBillingModalOpen(true);
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
      setCart([]);
      setIsStepperOpen(false);
      setCurrentSaleId(-1);
      loadProducts();
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      toast.error("Failed to confirm payment. Please try again.");
    }
  };

  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "card" | "upi"
  >();
  const [currentStepperStep, setCurrentStepperStep] = useState(1);

  useEffect(() => {
    if (currentStepperStep === 2) {
      if (selectedPaymentMethod === "upi" && !paymentQR) {
        processPayment("upi");
      } else if (selectedPaymentMethod === "card") {
        processPayment("card");
      } else {
        processPayment("cash");
      }
    }
  }, [currentStepperStep, selectedPaymentMethod]);

  const handleSelectPaymentMethod = (method: "cash" | "card" | "upi") => {
    setSelectedPaymentMethod(method);
    if (method !== "upi") {
      setPaymentQR(null);
    }
  };

  const fetchProductDetails = async (productIds: number[]) => {
    try {
      const response = await axios.post(`${baseUrl}/api/products/details`, {
        productIds,
      });
      return response.data; // Array of product details
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  };

  const validateSale = async () => {
    const token = localStorage.getItem("token");
    const errors: string[] = [];

    // Check user is authenticated
    if (!token) {
      errors.push("User must be logged in");
    }

    // Check cart has items
    if (!cart.length) {
      errors.push("At least one item is required");
      return errors; // Early return if cart is empty
    }

    // Validate individual items
    const productIds = cart.map((item) => item.id);
    const products = await fetchProductDetails(productIds);

    cart.forEach((item, index) => {
      const product = products.find((p) => p.id === item.id);

      // Check if product exists
      if (!product) {
        errors.push(`Item ${index + 1}: Product not found`);
        return;
      }

      // Check if quantity is valid
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        errors.push(
          `Item ${index + 1}: Insufficient stock for ${product.name}`
        );
      }
    });

    return errors;
  };

  const handleCreateSale = async () => {
    try {
      const validationErrors = await validateSale();

      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => toast.error(error));
        return;
      }

      setIsStepperOpen(true);
      setCurrentStepperStep(1);
      setSelectedPaymentMethod(undefined);
      setPaymentQR(null);
    } catch (error) {
      console.error("Error during validation:", error);
      toast.error("Failed to validate sale. Please try again.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col space-y-6">
      <AnimatePresence>
        {isStepperOpen && (
          <motion.div
            key="stepper-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg p-6 w-full max-w-md relative"
            >
              <Stepper
                initialStep={1}
                onClose={() => setIsStepperOpen(false)}
                onStepChange={(step) => setCurrentStepperStep(step)}
                onFinalStepCompleted={() => {
                  {
                    selectedPaymentMethod &&
                      confirmPayment(currentSaleId, selectedPaymentMethod);
                  }
                }}
                nextButtonText={
                  currentStepperStep === 2 && selectedPaymentMethod === "upi"
                    ? "Verify"
                    : undefined
                }
                nextButtonProps={{
                  disabled: currentStepperStep === 1 && !selectedPaymentMethod,
                }}
              >
                <Step>
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">
                      Select Payment Method
                    </h2>
                    <button
                      onClick={() => handleSelectPaymentMethod("cash")}
                      className={`p-2 rounded ${
                        selectedPaymentMethod === "cash"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => handleSelectPaymentMethod("card")}
                      className={`p-2 rounded ${
                        selectedPaymentMethod === "card"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => {
                        handleSelectPaymentMethod("upi");
                        setPaymentQR(null); // Reset QR when selecting UPI again
                      }}
                      className={`p-2 rounded ${
                        selectedPaymentMethod === "upi"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      UPI
                    </button>
                  </div>
                </Step>
                <Step>
                  {selectedPaymentMethod === "cash" && (
                    <div className="text-center">
                      <img
                        src={moneyClipart}
                        alt="Cash"
                        className="mx-auto h-40 w-40"
                      />
                      <button className="border border-blue-600 text-blue-800 focus:outline-none hover:bg-gray-50 transition-all duration-200">
                        VIEW ORDERS →
                      </button>
                      <p className="mt-2">
                        Order successfully created. Please collect the cash.
                      </p>
                    </div>
                  )}
                  {selectedPaymentMethod === "card" && (
                    <div className="text-center">
                      <img
                        src={cardsClipart}
                        alt="Cash"
                        className="mx-auto h-40 w-40"
                      />
                      <button className="border border-blue-600 text-blue-800 focus:outline-none hover:bg-gray-50 transition-all duration-200">
                        VIEW ORDERS →
                      </button>
                      <p className="mt-2">
                        Order successfully created. Please verify the payment.
                      </p>
                    </div>
                  )}
                  {selectedPaymentMethod === "upi" && (
                    <div className="text-center">
                      {paymentQR ? (
                        <>
                          <img
                            src={paymentQR}
                            alt="QR Code"
                            className="mx-auto h-48 w-48"
                          />
                          <p className="mt-4">
                            Order successfully created. Please verify the
                            payment.
                          </p>
                        </>
                      ) : (
                        <p>Generating QR code...</p>
                      )}
                    </div>
                  )}
                </Step>
              </Stepper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Row */}
      <div className="flex gap-6 pb-10" style={{ minHeight: "300px" }}>
        <div className="w-2/3">
          <ProductList
            products={products}
            onAddToCart={addToCart}
            onRefresh={loadProducts}
            isLoading={isProductsLoading}
          />
        </div>
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <BarcodeScanner onScan={handleBarcodeScan} />
          </div>
        </div>
      </div>

      {/* Shopping Cart Section */}
      <ShoppingCart
        cart={cart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeFromCart}
        onUpdateKg={updateQuantity}
      />

      {/* Bottom Section */}
      <div className="flex gap-6">
        <div className="w-2/3 flex flex-col gap-6">
          {/* Customer Display */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Running Total</h2>
            <p className="text-2xl font-bold">₹{totalPrice.toFixed(2)}</p>
          </div>

          {/* Special Features */}
          {/* <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Special Features</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleSplitBilling}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
              >
                Split Billing
              </button>
            </div>
            </div> */}
        </div>

        {/* Discount Code Input */}
        {/* <div className="w-1/3">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Discount Code</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="p-2 border rounded-lg flex-1"
              />
              <button
                onClick={applyDiscount}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div> */}

        {/* Loyalty Points Display */}
        {/* <div className="w-1/3">
          <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Loyalty Points</h2>
          <p className="text-2xl font-bold">{loyaltyPoints} Points</p>
          </div>
          </div> */}
      </div>

      <button
        onClick={handleCreateSale}
        className="bg-red-900 text-white self-end px-6 py-3 rounded-lg"
      >
        Create Sale
      </button>

      <Modal
        isOpen={isSplitBillingModalOpen}
        onClose={() => setIsSplitBillingModalOpen(false)}
      >
        <h2 className="text-lg font-semibold mb-4">Split Billing</h2>
        <p className="text-gray-500">
          Split billing functionality placeholder.
        </p>
      </Modal>
    </div>
  );
};

export default POSInterface;
