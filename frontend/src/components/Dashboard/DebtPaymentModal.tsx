import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Modal from "../POSInterface/Modal";
import { baseUrl } from "../../../utils/services";

interface Customer {
  id: number;
  name: string;
  phone: string;
  debtAmount: number;
}

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentAmount < 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    
    if (paymentAmount > customer.debtAmount) {
      toast.error("Payment amount cannot exceed debt amount");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${baseUrl}/api/customers/debt/${customer.id}`,
        {
            debtAmount: paymentAmount,
            from: 'customer',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.status === 200) {
        toast.success("Debt payment processed successfully");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.response?.data?.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Process Debt Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Customer:</span>
            <span className="font-medium">{customer.name || customer.phone}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Phone:</span>
            <span>{customer.phone}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Outstanding Debt:</span>
            <span className="text-red-600 font-semibold">₹{customer.debtAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border rounded-lg px-4 py-2 bg-white text-black"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              max={customer.debtAmount}
              min={0.0}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <select 
              className="w-full border rounded-lg px-4 py-2 bg-white text-black"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          
          <div className="flex justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Payment"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DebtPaymentModal;