// StaffDetailsModal.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Modal from "../POSInterface/Modal";
import { baseUrl } from "../../../utils/services";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

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
  amount: number;
  type: "advance" | "incentive";
  paidAt: string;
  month: string;
  notes?: string;
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
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
      setSalaryHistory(response.data.payments || []);
    } catch (error) {
      console.error("Error fetching salary history:", error);
      toast.error("Failed to fetch salary history");
    } finally {
      setLoading(false);
    }
  };
  if (!staff) return null;
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      // Replace with your actual API endpoint
      const response = await axios.delete(`${baseUrl}/api/users/${staff.id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add your auth token if needed
        },
      });

      if (response.status === 200) {
        toast.success("Staff deleted successfully");
        onClose(); // Close the details modal
        // Add any additional cleanup or refresh logic here
      }
    } catch (error) {
      console.error("Error deleting Staff", error);
      toast.error("Failed to delete Staff");
    } finally {
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  return (
    <>
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
            <div className="space-y-4">
              {salaryHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm ${
                          payment.type === "advance"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {payment.type.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {payment.month}
                      </span>
                    </div>
                    <div className="text-lg font-semibold">
                      ₹{payment.amount}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {payment.notes && (
                      <span className="text-gray-500 italic">
                        "{payment.notes}"
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="mt-6 border-t pt-4">
              <button
                onClick={() => {
                  setStaffToDelete(staff?.id || null);
                  setIsDeleteModalOpen(true);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleDeleteStaff}
        message="Are you sure you want to delete this customer? This action cannot be undone."
      />
    </>
  );
};

export default StaffDetailsModal;
