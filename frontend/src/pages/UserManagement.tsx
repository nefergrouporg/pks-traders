import axios from "axios";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faToggleOn,
  faToggleOff,
  faList,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { baseUrl } from "../../utils/services";
import Modal from "../components/POSInterface/Modal.tsx";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  products?: Product[];
}

interface Branch {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  staffId?: string;
  salaryCredited?: boolean;
  active?: boolean;
  branch?: Branch;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

// User Management Page
const UserManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staffs, setStaffs] = useState<User[]>([]);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newStaff, setNewStaff] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    staffId: "",
    salary: 0,
    branchId: "",
  });
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [currentSupplierProducts, setCurrentSupplierProducts] = useState<
    Product[]
  >([]);
  const [currentSupplierName, setCurrentSupplierName] = useState("");
  const [currentSupplierId, setCurrentSupplierId] = useState<number | null>(
    null
  );
  const [isPaySalaryModalOpen, setIsPaySalaryModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<User | null>(null);

  const openSupplierModal = () => setIsSupplierModalOpen(true);
  const closeSupplierModal = () => setIsSupplierModalOpen(false);

  const openProductsModal = (supplier: Supplier) => {
    // Use the products that are already included in the supplier data
    setCurrentSupplierProducts(supplier.products || []);
    setCurrentSupplierName(supplier.name);
    setCurrentSupplierId(supplier.id);
    setIsProductsModalOpen(true);
  };

  const closeProductsModal = () => setIsProductsModalOpen(false);

  const handleSupplierInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setSupplierFormData({ ...supplierFormData, [name]: value });
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${baseUrl}/api/supplier`,
        supplierFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        toast.success(response.data.message || "Supplier Created successfully");
        closeSupplierModal();
        setSupplierFormData({
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
        });
      } else {
        toast.error(
          response.data.message || "Failed to create supplier, Please try again"
        );
      }

      fetchSuppliers();
    } catch (error) {
      console.error("Error creating supplier:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/supplier`);
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseUrl}/api/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fix: Check the structure of response and set branches accordingly
      if (Array.isArray(response.data)) {
        setBranches(response.data);
      } else if (response.data && Array.isArray(response.data.branches)) {
        setBranches(response.data.branches);
      } else {
        console.error("Unexpected branches data format:", response.data);
        setBranches([]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to fetch branches");
      setBranches([]);
    }
  };

  const fetchStaffs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseUrl}/api/users`, {
        params: { role: "staff" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && Array.isArray(response.data.users)) {
        setStaffs(response.data.users);
      } else {
        console.error("Unexpected staff data format:", response.data);
        setStaffs([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to fetch staff");
      setStaffs([]);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
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
          staffId: "",
          salary: 0,
          branchId: "",
        });
        fetchStaffs();
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      console.error("Response data:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create staff");
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchBranches();
    fetchStaffs();
  }, []);

  const handleToggleSupplier = async (supplierId: number) => {
    try {
      const token = localStorage.getItem("token");
      const supplier = suppliers.find((s) => s.id === supplierId);

      if (!supplier) {
        toast.error("Supplier not found");
        return;
      }

      // Toggle the `active` status locally
      const updatedSupplier = { ...supplier, active: !supplier.active };

      // Send the request to update the supplier on the backend
      const response = await axios.put(
        `${baseUrl}/api/supplier/${supplierId}/toggle-block`,
        { active: updatedSupplier.active }, // Send the new `active` status
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Update the local state to reflect the change
        setSuppliers((prevSuppliers) =>
          prevSuppliers.map((s) =>
            s.id === supplierId ? { ...s, active: updatedSupplier.active } : s
          )
        );

        toast.success(
          response.data.message ||
            `Supplier ${
              updatedSupplier.active ? "activated" : "blocked"
            } successfully`
        );
      }
    } catch (error) {
      console.error("Error toggling block status:", error);
      toast.error("Failed to toggle supplier status");
    }
  };

  const handleToggleStaff = async (staffId: number) => {
    try {
      const token = localStorage.getItem("token");
      const staff = staffs.find((s) => s.id === staffId);

      if (!staff) {
        toast.error("Staff not found");
        return;
      }

      // Send request to backend to toggle status
      const response = await axios.put(
        `${baseUrl}/api/users/toggle-block/${staffId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Update local state with new status
        setStaffs((prevStaffs) =>
          prevStaffs.map((s) =>
            s.id === staffId ? { ...s, active: response.data.active } : s
          )
        );

        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast.error("Failed to toggle staff status");
    }
  };

  const handleSalaryCredit = async (staffId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${baseUrl}/api/users/salaryCredit`,
        { id: staffId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success(response.data.message || "Salary updated successfully");
        // Update the staff's salary status in the local state
        setStaffs((prevStaffs) =>
          prevStaffs.map((s) =>
            s.id === staffId ? { ...s, salaryCredited: true } : s
          )
        );
      } else {
        toast.error(
          response.data.message ||
            "There is something wrong with updating salary"
        );
      }
    } catch (error) {
      console.error("Error crediting salary:", error);
      toast.error("Failed to update salary status");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-xl font-bold mb-4 sm:mb-0">Suppliers</h2>
            <button
              onClick={openSupplierModal}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200"
            >
              Create Supplier
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Contact Person</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Address</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Products</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t">
                    <td className="p-3">{supplier.name}</td>
                    <td className="p-3">{supplier.contactPerson}</td>
                    <td className="p-3">{supplier.email}</td>
                    <td className="p-3">{supplier.phone}</td>
                    <td className="p-3">{supplier.address}</td>
                    <td className="p-3">
                      <button onClick={() => handleToggleSupplier(supplier.id)}>
                        <FontAwesomeIcon
                          icon={supplier.active ? faToggleOff : faToggleOn}
                          className={`text-2xl ${
                            supplier.active ? "text-red-900" : "text-green-500"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => openProductsModal(supplier)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FontAwesomeIcon icon={faList} className="mr-1" />
                        View Products
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Modal Component */}
        <Modal isOpen={isProductsModalOpen} onClose={closeProductsModal}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {currentSupplierName}'s Products
            </h2>
            {currentSupplierProducts && currentSupplierProducts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSupplierProducts.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-3">{product.name}</td>
                        <td className="p-3">${product.price.toFixed(2)}</td>
                        <td className="p-3">{product.description}</td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No products found for this supplier.
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeProductsModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Supplier Modal */}
        <Modal isOpen={isSupplierModalOpen} onClose={closeSupplierModal}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Create New Supplier</h2>
            <form className="space-y-4" onSubmit={handleCreateSupplier}>
              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={supplierFormData.name}
                  onChange={handleSupplierInputChange}
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={supplierFormData.contactPerson}
                  onChange={handleSupplierInputChange}
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter contact person"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={supplierFormData.email}
                  onChange={handleSupplierInputChange}
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter email"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={supplierFormData.phone}
                  onChange={handleSupplierInputChange}
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={supplierFormData.address}
                  onChange={handleSupplierInputChange}
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter address"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Create Supplier
              </button>
            </form>
          </div>
        </Modal>

        {/* Staffs Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-xl font-bold mb-4 sm:mb-0">Staffs</h2>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200 w-full md:w-auto"
            >
              Add Staff
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-gray-50">
                <tr className="items-center">
                  <th className="p-3">Staff ID</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Salary Status</th>
                  <th className="p-3">Actions</th>
                  <th className="p-3">Block/UnBlock</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff) => (
                  <tr key={staff.id} className="border-t items-center">
                    <td className="p-3 align-middle">
                      {staff.staffId || "N/A"}
                    </td>
                    <td className="p-3 align-middle">{staff.username}</td>
                    <td className="p-3 align-middle">{staff.email}</td>
                    <td className="p-3 align-middle">{staff.phone}</td>
                    <td className="p-3 align-middle">
                      {staff.branch?.name || "Not Assigned"}
                    </td>
                    <td className="p-3 align-middle">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          staff.salaryCredited
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {staff.salaryCredited ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3 align-middle flex justify-center gap-3">
                      {!staff.salaryCredited ? (
                        <button
                          className="text-green-600 hover:text-green-800 flex items-center"
                          onClick={() => handleSalaryCredit(staff.id)}
                        >
                          <FontAwesomeIcon
                            icon={faMoneyBill}
                            className="mr-1"
                          />
                          Mark as Paid
                        </button>
                      ) : (
                        <button className="bg-green-500 text-white px-3 py-1 rounded text-xs">
                          Paid
                        </button>
                      )}
                    </td>
                    <td className="p-3 align-middle">
                      {/* Toggle Block/Unblock Button */}
                      <button onClick={() => handleToggleStaff(staff.id)}>
                        <FontAwesomeIcon
                          icon={staff.active ? faToggleOn : faToggleOff}
                          className={`text-2xl ${
                            staff.active ? "text-green-500" : "text-red-900"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
      >
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">Create New Staff</h3>
          <form onSubmit={handleAddStaff}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  value={newStaff.username}
                  placeholder="Enter a non-existing username"
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  value={newStaff.email}
                  placeholder="Enter email here"
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  value={newStaff.phone}
                  placeholder="Enter mobile number"
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  value={newStaff.password}
                  placeholder="Set up a password"
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Branch</label>
                <select
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  value={newStaff.branchId}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, branchId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Branch</option>
                  {branches && branches.length > 0 ? (
                    branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No branches available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={newStaff.salary}
                  onChange={(e) =>
                    setNewStaff({
                      ...newStaff,
                      salary: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                  placeholder="Enter salary amount"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Create Staff
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
