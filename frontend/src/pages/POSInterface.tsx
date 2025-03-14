import axios from "axios";
import React, { useEffect, useState } from "react";
import BarcodeScanner from "../components/POSInterface/BarcodeScanner";
import { baseUrl } from "../../utils/services";
import ProductList from "../components/POSInterface/ProductList";
import ShoppingCart from "../components/POSInterface/ShoppingCart";
import { toast } from "sonner";

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
    { id: number; name: string; price: number; quantity: number }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">(
    "cash"
  );
  const [discountCode, setDiscountCode] = useState("");
  const [isSplitBillingModalOpen, setIsSplitBillingModalOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(150);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/products`);
        setProducts(response.data.products);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };
    loadProducts();
  }, [cart]);

  // Add item to cart
  // const addToCart = (product: { id: number; name: string; price: number }) => {
  //   const existingItem = cart.find((item) => item.id === product.id);
  //   if (existingItem) {
  //     setCart((prevCart) =>
  //       prevCart.map((item) =>
  //         item.id === product.id
  //           ? { ...item, quantity: item.quantity + 1 }
  //           : item
  //       )
  //     );
  //   } else {
  //     setCart((prevCart) => [...prevCart, { ...product, quantity: 1 }]);
  //   }
  // };

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      return existingItem
        ? prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const increaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem?.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
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
  const processPayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const saleData = {
        items: cart.map((item) => ({
          productId: item.id, // Ensure productId is included
          quantity: item.quantity,
        })),
        paymentMethod: "qr",
        customerId: "CUST-123", // Ensure this matches the Sale model
      };

      const response = await axios.post(`${baseUrl}/api/sales`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setPaymentQR(response.data.paymentQR);

      // Handle payment success
      const checkPaymentStatus = setInterval(async () => {
        const statusResponse = await axios.get(
          `/api/payments/${response.data.sale.id}`
        );
        if (statusResponse.data.status === "paid") {
          clearInterval(checkPaymentStatus);
          alert("Payment successful!");
          setCart([]);
        }
      }, 5000);
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(error?.response?.data?.error || "something went wrong");
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col space-y-6">
      {/* Top Row */}
      <div className="flex gap-6" style={{ minHeight: "400px" }}>
        <div className="w-1/2 flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Barcode Scanner Feed</h2>
            <BarcodeScanner onScan={handleBarcodeScan} />
          </div>
        </div>

        <div className="w-1/2">
          <ProductList products={products} onAddToCart={addToCart} />
        </div>
      </div>

      {/* Shopping Cart Section */}
      <ShoppingCart
        cart={cart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeFromCart}
      />

      {/* Bottom Section */}
      {/* <div className="flex gap-6">
        <div className="w-2/3 flex flex-col gap-6">
          <CustomerDisplay totalPrice={totalPrice} />
          <DiscountCodeInput
            discountCode={discountCode}
            setDiscountCode={setDiscountCode}
          />
          <PaymentMethodToggle
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
          <SpecialFeatures onSplitBilling={() => setIsSplitBillingModalOpen(true)} />
        </div>

        <div className="w-1/3">
          <LoyaltyPointsDisplay loyaltyPoints={loyaltyPoints} />
        </div>
      </div> */}

      {/* Bottom Section */}
      <div className="flex gap-6">
        <div className="w-2/3 flex flex-col gap-6">
          {/* Customer Display */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Running Total</h2>
            <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
          </div>

          {/* Discount Code Input */}
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

          {/* Payment Method Toggles */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`px-4 py-2 rounded-lg ${
                  paymentMethod === "cash"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`px-4 py-2 rounded-lg ${
                  paymentMethod === "card"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod("upi")}
                className={`px-4 py-2 rounded-lg ${
                  paymentMethod === "upi"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                UPI
              </button>
            </div>
          </div>

          {/* Special Features */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Special Features</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleSplitBilling}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
              >
                Split Billing
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/3">
          {/* Loyalty Points Display */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">Loyalty Points</h2>
            <p className="text-2xl font-bold">{loyaltyPoints} Points</p>
          </div>
        </div>
      </div>

      <button
        onClick={processPayment}
        className="bg-red-900 text-white self-end px-6 py-3 rounded-lg"
      >
        Create Sale
      </button>

      {/* Payment QR Display */}
      {paymentQR && (
        <div className="qr-overlay">
          <img src={paymentQR} alt="Payment QR Code" />
          <p>Scan to complete payment</p>
        </div>
      )}

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
