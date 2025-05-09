import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faToggleOff,
  faToggleOn,
  faMoneyBill,
  faEye,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal";
import ConfirmationModal from "../components/Dashboard/ConfirmationModal";
import StaffDetailsModal from "../components/Dashboard/StaffDetailsModal";
import SalaryPaymentModal from "../components/Dashboard/SalaryPaymentModal";
import DeleteConfirmationModal from "../components/Dashboard/DeleteConfirmationModal";
import { jwtDecode, JwtPayload } from "jwt-decode";

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
  isDeleted?: boolean;
  totalIncentives?: number;
}

interface CustomJwtPayload extends JwtPayload {
  role: "admin" | "manager" | "staff";
}

interface Branch {
  id: number;
  name: string;
}

interface NewStaff {
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: "staff" | "admin" | "manager";
  salary: number;
  branchId: string;
  age?: number;
  gender?: string;
  aadharNumber?: string;
  address?: string;
}

const Employees: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToToggle, setStaffToToggle] = useState<number | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [staffTab, setStaffTab] = useState<"active" | "deleted">("active");

  const [newStaff, setNewStaff] = useState<NewStaff>({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    salary: 0,
    branchId: "",
    age: undefined,
    gender: "",
    aadharNumber: "",
    address: "",
  });

  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("You are not authenticated");
    return null;
  }
  const decoded = jwtDecode(token) as CustomJwtPayload;

  useEffect(() => {
    fetchBranches();
    fetchStaffs();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(
        Array.isArray(response.data)
          ? response.data
          : response.data.branches || []
      );
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to fetch branches");
    }
  };

  const fetchStaffs = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/users`, {
        params: { role: "staff" },
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffs(response.data?.users);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to fetch staff");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}/api/users`, newStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        toast.success("Staff created successfully");
        setIsAddStaffModalOpen(false);
        setNewStaff({
          username: "",
          email: "",
          phone: "",
          password: "",
          role: "staff",
          salary: 0,
          branchId: "",
          age: undefined,
          gender: "",
          aadharNumber: "",
          address: "",
        });
        fetchStaffs();
      }
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast.error(error.response?.data?.message || "Failed to create staff");
    }
  };

  const handleToggleStaff = async () => {
    if (!staffToToggle) return;
    try {
      const response = await axios.put(
        `${baseUrl}/api/users/toggle-block/${staffToToggle}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.id === staffToToggle ? { ...s, isBlocked: !s.isBlocked } : s
          )
        );
        toast.success("Staff status updated");
      }
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast.error("Failed to toggle status");
    } finally {
      setIsConfirmationModalOpen(false);
      setStaffToToggle(null);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const response = await axios.delete(
        `${baseUrl}/api/users/${staffToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        toast.success("Staff deleted successfully");
        fetchStaffs();
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(error.message || "Failed to delete staff");
    } finally {
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleSalarySuccess = () => {
    if (!selectedStaff) return;

    setStaffs((prev) =>
      prev.map((s) =>
        s.id === selectedStaff.id ? { ...s, salaryCredited: true } : s
      )
    );
  };

  const openStaffDetails = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDetailsModalOpen(true);
  };

  const openSalaryModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsSalaryModalOpen(true);
  };

  const filteredStaffs = staffs.filter((staff) => {
    const matchesTab =
      staffTab === "active" ? !staff.isDeleted : staff.isDeleted === true;
    const matchesSearch =
      staff.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.phone &&
        staff.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaffs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search staff by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-400 bg-white rounded-lg flex-1 text-sm sm:text-base text-black"
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
          onClick={() => setIsAddStaffModalOpen(true)}
        >
          Add Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 font-medium ${
              staffTab === "active"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setStaffTab("active");
              setCurrentPage(1);
            }}
          >
            Employees
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              staffTab === "deleted"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setStaffTab("deleted");
              setCurrentPage(1);
            }}
          >
            Deleted Employees
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Branch</th>
                <th className="p-3 text-left">Salary</th>
                {/* <th className="p-3 text-left">Status</th> */}
                <th className="p-3 text-left">Pay</th>
                <th className="p-3 text-left">View</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {currentItems.map((staff) => (
                <tr key={staff.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{staff.username}</td>
                  <td className="p-3">{staff.email}</td>
                  <td className="p-3">{staff.phone || "N/A"}</td>
                  <td className="p-3">{staff?.Branch?.name || "N/A"}</td>
                  <td className="p-3">
                    ₹
                    {(
                      Number(staff?.salary ?? 0) +
                      Number(staff?.totalIncentives ?? 0)
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  {/* <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        staff.salaryCredited
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {staff.salaryCredited ? "Paid" : "Pending"}
                    </span>
                  </td> */}
                  <td>
                    <button
                      onClick={() => openSalaryModal(staff)}
                      className={`
                        ${
                          staff.isBlocked
                            ? "text-gray-600 cursor-not-allowed"
                            : staff.salaryCredited
                            ? "text-green-600 hover:text-green-800"
                            : "text-red-600 hover:text-red-800"
                        }
                      `}
                      disabled={staff.isBlocked || staff.salaryCredited}
                      title="Process Salary"
                    >
                      <FontAwesomeIcon icon={faMoneyBill} />
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openStaffDetails(staff)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    {!staff.isDeleted && (
                      <button
                        onClick={() => {
                          setStaffToDelete(staff.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Staff"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setStaffToToggle(staff.id);
                        setIsConfirmationModalOpen(true);
                      }}
                      className={
                        staff.isBlocked ? "text-red-600" : "text-green-600"
                      }
                      title={staff.isBlocked ? "Unblock Staff" : "Block Staff"}
                    >
                      <FontAwesomeIcon
                        icon={staff.isBlocked ? faToggleOff : faToggleOn}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-2 px-4 py-2 bg-gray-300 rounded-lg">
          {currentPage}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={indexOfLastItem >= filteredStaffs.length}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
      >
        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-5">Create New Staff</h2>
          <form onSubmit={handleAddStaff} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username*
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.username}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email*</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password*
                </label>
                <input
                  type="password"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.age || ""}
                  onChange={(e) =>
                    setNewStaff({
                      ...newStaff,
                      age: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.gender}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, gender: e.target.value })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.aadharNumber}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, aadharNumber: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  rows={3}
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Salary*
                </label>
                <input
                  type="number"
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.salary}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, salary: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Branch*
                </label>
                <select
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.branchId}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, branchId: e.target.value })
                  }
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role*</label>
                <select
                  required
                  className="w-full border rounded-lg px-4 py-2 bg-white text-black"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({
                      ...newStaff,
                      role: e.target.value as "staff" | "admin" | "manager",
                    })
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  {decoded.role === "admin" && (
                    <option value="admin">Admin</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Staff
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirmation Modal for Block/Unblock */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleToggleStaff}
        currentStatus={
          staffs.find((s) => s.id === staffToToggle)?.isBlocked || false
        }
        title="Confirm Action"
        message={`Are you sure you want to ${
          staffs.find((s) => s.id === staffToToggle)?.isBlocked
            ? "unblock"
            : "block"
        } this staff member?`}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleDeleteStaff}
        message="Are you sure you want to delete this staff member? This action cannot be undone."
      />

      {/* Staff Details Modal */}
      <StaffDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        staff={selectedStaff}
      />

      {/* Salary Payment Modal */}
      {selectedStaff && (
        <SalaryPaymentModal
          isOpen={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          staff={selectedStaff}
          onSuccess={() => {
            handleSalarySuccess();
            fetchStaffs();
          }}
        />
      )}
    </div>
  );
};

export default Employees;
