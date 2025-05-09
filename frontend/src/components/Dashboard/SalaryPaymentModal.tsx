import React, { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import Modal from "../POSInterface/Modal";
import { baseUrl } from "../../../utils/services";

interface SalaryPaymentProps {
  staff: {
    id: number;
    username: string;
    salary: number;
    remainingSalary?: number;
    totalAdvances?: number;
    totalIncentives?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SalaryPaymentModal: React.FC<SalaryPaymentProps> = ({
  staff,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  console.log("Staff data:", staff);
  // console.log("Payment date:", paymentDate);

  const remainingSalary = useMemo(() => {
    return staff.remainingSalary || staff.salary - (staff.totalAdvances || 0);
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/api/users/salaryCredit`,
        {
          userId: staff.id,
          amount,
          paymentDate,
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Payment response:", response.data);
      if (response.status === 201) {
        toast.success(`Payment processed for ${staff.username}`);
        onSuccess();
        onClose();
        setAmount(0);
        setNotes("");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-5">Process Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Staff Name</label>
            <input
              type="text"
              value={staff.username}
              disabled
              className="w-full border rounded-lg px-4 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Salary (₹)
            </label>
            <input
              type="text"
              value={`₹${(
                Number(staff?.salary ?? 0) + Number(staff?.totalIncentives ?? 0)
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              disabled
              className="w-full border rounded-lg px-4 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Remaining Salary (₹)
            </label>
            <input
              type="number"
              value={remainingSalary}
              disabled
              className="w-full border rounded-lg px-4 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Amount (₹)*
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
              className="w-full border rounded-lg px-4 py-2"
              required
            />
            {remainingSalary > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Max advance available: ₹{remainingSalary}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Date*
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Optional payment notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Payment"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SalaryPaymentModal;
