import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { baseUrl } from "../../utils/services";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  retailPrice: number;
  wholeSalePrice?: number;
  stock: number;
  unitType: "pcs" | "kg";
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

interface Customer {
  id: number;
  name: string | null;
  phone: string;
}

interface Payment {
  id?: number;
  method: "cash" | "card" | "upi" | "debt";
  amount: number;
  status: "pending" | "completed";
  qr?: string;
}

interface Sale {
  id: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
    product: Product;
  }[];
  payments: Payment[];
  customer?: Customer | null;
  saleType: "retail" | "wholeSale" | "hotel";
  purchaseDate: string;
  recievedAmount: number;
}

interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({
  sale,
  onClose,
  onUpdate,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<
    "cash" | "card" | "upi" | "debt"
  >("cash");
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [pendingUPIPayment, setPendingUPIPayment] = useState<Payment | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("token");

  const selectedCustomer = sale.customer || null;
  const saleType = sale.saleType;
  const saleDate = sale.purchaseDate;

  useEffect(() => {
    loadProducts();
    initializeSaleData();
  }, [sale]);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    }
  };

  const initializeSaleData = () => {
    const initialCart = sale.items.map((item) => ({
      id: item.productId,
      name: item.product.name,
      retailPrice: item.product.retailPrice,
      wholeSalePrice: item.product.wholeSalePrice,
      quantity: item.quantity,
      unitType: item.product.unitType,
      price: item.price,
      stock: item.product.stock + item.quantity,
    }));
    setCart(initialCart);
    setPayments(
      sale.payments.map((p) => ({
        id: p.id,
        method: p.paymentMethod,
        amount: p.amount,
        status: p.status || "completed",
        qr: p.qr,
      }))
    );
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    const priceToUse =
      saleType === "wholeSale" && product.wholeSalePrice
        ? product.wholeSalePrice
        : product.retailPrice;
    if (existingItem) {
      if (existingItem.quantity + 1 > existingItem.stock) {
        toast.error(`Cannot exceed available stock for ${product.name}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }
      setCart([
        ...cart,
        { ...product, quantity: 1, price: priceToUse, stock: product.stock },
      ]);
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const increaseQuantity = (productId: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const newQuantity =
            item.quantity + (item.unitType === "kg" ? 0.1 : 1);
          if (newQuantity > item.stock) {
            toast.error(`Cannot exceed available stock for ${item.name}`);
            return item;
          }
          return { ...item, quantity: parseFloat(newQuantity.toFixed(2)) };
        }
        return item;
      })
    );
  };

  const decreaseQuantity = (productId: number) => {
    setCart(
      cart
        .map((item) =>
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
        .filter((item) => item.quantity > 0)
    );
  };

  const updatePrice = (productId: number, newPrice: number) => {
    if (newPrice >= 0) {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, price: newPrice } : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const isCartValid = () => {
    return cart.length > 0 && cart.every((item) => item.quantity > 0);
  };

  const isSaleEdited = () => {
    const originalItems = sale.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    const updatedItems = cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const originalPayments = sale.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
    }));
    const updatedPayments = payments.map((p) => ({
      method: p.method,
      amount: p.amount,
    }));

    return (
      JSON.stringify(originalItems) !== JSON.stringify(updatedItems) ||
      JSON.stringify(originalPayments) !== JSON.stringify(updatedPayments)
    );
  };

  const handleSave = async () => {
    if (!isCartValid()) {
      toast.error("Cart cannot be empty");
      return;
    }
    if (totalPaid < totalPrice) {
      toast.error("Received amount cannot be less than total amount");
      return;
    }

    try {
      const updatedItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const updatedPayments = payments.map((p) => ({
        method: p.method,
        amount: p.amount,
      }));

      const response = await axios.put(
        `${baseUrl}/api/sales/${sale.id}`,
        {
          items: updatedItems,
          payments: updatedPayments,
          customerId: selectedCustomer?.id || null,
          saleType,
          ReceivedAmount: totalPaid,
          saleDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        toast.success("Sale updated successfully");
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Failed to update sale");
    }
  };

  const addPayment = async () => {
    if (newPaymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    if (newPaymentMethod === "upi") {
      try {
        const response = await axios.post(
          `${baseUrl}/api/sales/${sale.id}/payments`,
          {
            paymentMethod: "upi",
            amount: newPaymentAmount,
            status: "pending",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const paymentData = response.data;
        const qrCode = paymentData.paymentQR || paymentData.payment?.qr;
        if (!qrCode) {
          console.error("No QR code in response:", paymentData);
          toast.error("Failed to generate UPI QR code");
          return;
        }

        const newPayment: Payment = {
          id: paymentData.payment?.id,
          method: "upi",
          amount: newPaymentAmount,
          status: "pending",
          qr: qrCode,
        };
        setPendingUPIPayment(newPayment);
        setNewPaymentAmount(0);
      } catch (error) {
        console.error("Error adding UPI payment:", error);
        toast.error("Failed to generate UPI QR code");
      }
    } else {
      setPayments([
        ...payments,
        {
          method: newPaymentMethod,
          amount: newPaymentAmount,
          status: "completed",
        },
      ]);
      setNewPaymentMethod("cash");
      setNewPaymentAmount(0);
    }
  };

  const confirmUPIPayment = async () => {
    if (!pendingUPIPayment) return;

    try {
      await axios.put(
        `${baseUrl}/api/payments/${pendingUPIPayment.id}/confirm`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPayments([...payments, { ...pendingUPIPayment, status: "completed" }]);
      setPendingUPIPayment(null);
      toast.success("UPI payment confirmed");
    } catch (error) {
      console.error("Error confirming UPI payment:", error);
      toast.error("Failed to confirm UPI payment");
    }
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.barcode?.includes(searchTerm)
      );
      setFilteredProducts(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredProducts([]);
      setIsDropdownOpen(false);
    }
  }, [searchTerm, products]);

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      addToCart(filteredProducts[0]);
    }
  };

  const paymentOptions = [
    { method: "cash", label: "Cash" },
    { method: "card", label: "Card" },
    // { method: "upi", label: "UPI" },
    { method: "debt", label: "Debt" },
  ];

  const availablePaymentOptions = selectedCustomer
    ? paymentOptions
    : paymentOptions.filter((option) => option.method !== "debt");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Sale #{sale.id}</h2>

        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Sale Type: </span>
          <span className="text-sm text-gray-900 capitalize">{saleType}</span>
        </div>

        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Customer: </span>
          {selectedCustomer ? (
            <span className="text-sm text-gray-900">
              {selectedCustomer.name || "No Name"} ({selectedCustomer.phone})
            </span>
          ) : (
            <span className="text-sm text-gray-500">Guest Customer</span>
          )}
        </div>

        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Sale Date: </span>
          <span className="text-sm text-gray-900">
            {new Date(saleDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="mb-4">
          <input
            ref={productSearchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleProductKeyDown}
            placeholder="Search products by name or barcode"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isDropdownOpen && (
            <div className="absolute z-10 w-full max-w-3xl mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between">
                    <span>{product.name}</span>
                    <span>
                      ₹
                      {saleType === "wholeSale" && product.wholeSalePrice
                        ? product.wholeSalePrice
                        : product.retailPrice}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Stock: {product.stock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Cart</h3>
          {cart.length === 0 ? (
            <div className="text-gray-500">No items in cart</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 text-sm font-medium text-gray-600">
                <span className="col-span-4">Item</span>
                <span className="col-span-2 text-center">Price</span>
                <span className="col-span-3 text-center">Quantity</span>
                <span className="col-span-2 text-right">Total</span>
                <span className="col-span-1"></span>
              </div>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2 grid grid-cols-12 items-center text-sm"
                >
                  <span className="col-span-4">{item.name}</span>
                  <div className="col-span-2 text-center">
                    {saleType === "wholeSale" || saleType === "hotel" ? (
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updatePrice(item.id, parseFloat(e.target.value))
                        }
                        className="w-16 border rounded py-1 px-2 text-center"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      `₹${item.price.toFixed(2)}`
                    )}
                  </div>
                  <div className="col-span-3 text-center flex justify-center items-center">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="w-6 h-6 bg-gray-200 rounded-l hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.id)}
                      className="w-6 h-6 bg-gray-200 rounded-r hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <span className="col-span-2 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="col-span-1 text-red-500 hover:text-red-700 text-right"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Payments</h3>
          {payments.map((payment, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <span className="capitalize">{payment.method}</span>
              <span>₹{payment.amount.toFixed(2)}</span>
              <button
                onClick={() => removePayment(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="mt-4 border-t pt-4">
            <h4 className="text-md font-semibold mb-2">Add Payment</h4>
            <div className="flex items-center space-x-2">
              <select
                value={newPaymentMethod}
                onChange={(e) =>
                  setNewPaymentMethod(
                    e.target.value as "cash" | "card" | "upi" | "debt"
                  )
                }
                className="border rounded px-2 py-1"
              >
                {availablePaymentOptions.map((option) => (
                  <option key={option.method} value={option.method}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newPaymentAmount}
                onChange={(e) =>
                  setNewPaymentAmount(parseFloat(e.target.value) || 0)
                }
                className="border rounded px-2 py-1 w-24"
                min="0"
                step="0.01"
              />
              {newPaymentMethod === "upi" ? (
                <button
                  onClick={addPayment}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generate QR
                </button>
              ) : (
                <button
                  onClick={addPayment}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              )}
            </div>
            {pendingUPIPayment && (
              <div className="mt-4 text-center">
                <p>UPI Payment: ₹{pendingUPIPayment.amount.toFixed(2)}</p>
                <img
                  src={pendingUPIPayment.qr}
                  alt="UPI QR Code"
                  className="h-40 w-40 mx-auto mt-2 border-2 border-gray-300 rounded-lg"
                />
                <div className="mt-2 flex justify-center space-x-2">
                  <button
                    onClick={confirmUPIPayment}
                    className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Payment Received
                  </button>
                  <button
                    onClick={() => setPendingUPIPayment(null)}
                    className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p>Total Price: ₹{totalPrice.toFixed(2)}</p>
            <p>Total Paid: ₹{totalPaid.toFixed(2)}</p>
            <p
              className={
                totalPaid === totalPrice ? "text-green-500" : "text-red-500"
              }
            >
              {totalPaid === totalPrice
                ? "Payment matches total"
                : `Payment does not match total: need additional ₹${(
                    totalPrice - totalPaid
                  ).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSave}
            disabled={
              !isCartValid() ||
              totalPaid !== totalPrice ||
              pendingUPIPayment !== null ||
              (selectedCustomer === null &&
                payments.some((p) => p.method === "debt"))
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSaleModal;
