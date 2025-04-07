// StaffDetailsModal.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Modal from "../POSInterface/Modal";
import { baseUrl } from "../../../utils/services";

interface Staff {
  id: number;
  username: string;
  email: string;
  phone?: string;
  salary: number;
  salaryCredited: boolean;
  isBlocked: boolean;
  Branch?: { name: string; id: number };
  role: "staff" | "admin" | "manager";
  age?: number;
  gender?: string;
  aadharNumber?: string;
  address?: string;
}

interface SalaryPayment {
  id: number;
  userId: number;
  amount: number;
  month: string;
  status: "paid" | "unpaid";
  paidAt: string | null;
  incentive: number;
  cutOff : number;
  paid: number;
}

interface StaffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const [salaryHistory, setSalaryHistory] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (staff && isOpen && activeTab === "salary") {
      fetchSalaryHistory();
    }
  }, [staff, isOpen, activeTab]);

  const fetchSalaryHistory = async () => {
    if (!staff) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/users/salary-history/${staff.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalaryHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching salary history:", error);
      toast.error("Failed to fetch salary history");
    } finally {
      setLoading(false);
    }
  };
  console.log(salaryHistory);
  if (!staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-5">
          {staff.username}'s Profile
        </h2>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${
              activeTab === "info"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("info")}
          >
            Personal Info
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "salary"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("salary")}
          >
            Salary History
          </button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Username</h3>
              <p className="text-base text-black">{staff.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-base text-black">{staff.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="text-base text-black">
                {staff.phone || "Not provided"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Branch</h3>
              <p className="text-base text-black">
                {staff.Branch?.name || "Not assigned"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="text-base capitalize text-black">{staff.role}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Salary</h3>
              <p className="text-base text-black">₹{staff.salary}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Age</h3>
              <p className="text-base text-black">
                {staff.age || "Not provided"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Gender</h3>
              <p className="text-base text-black">
                {staff.gender || "Not provided"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Aadhar Number
              </h3>
              <p className="text-base text-black">
                {staff.aadharNumber || "Not provided"}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="text-base text-black">
                {staff.address || "Not provided"}
              </p>
            </div>
          </div>
        )}

        {/* Salary History Tab */}
        {activeTab === "salary" && (
          <div>
            {loading ? (
              <div className="text-center py-4">Loading salary history...</div>
            ) : salaryHistory.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Paid Date</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Incentive</th>
                    <th className="p-2 text-left">Cut Off</th>
                    <th className="p-2 text-left">Paid</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  {salaryHistory.map((payment) => (
                    <tr key={payment.id} className="border-t">
                      <td className="p-2">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-2">₹{payment.amount}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2">₹{payment.incentive}</td>
                      <td className="p-2">₹{payment.cutOff}</td>
                      <td className="p-2">₹{payment.paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No salary payment records found
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StaffDetailsModal;
