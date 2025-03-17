import axios from "axios";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOn, faToggleOff } from "@fortawesome/free-solid-svg-icons";
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
}

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
}




// User Management Page
const UserManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staffs, setStaffs] = useState<User[]>([]);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
  });
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });
  const openSupplierModal = () => setIsSupplierModalOpen(true);
  const closeSupplierModal = () => setIsSupplierModalOpen(false);

  const handleSupplierInputChange = (e) => {
    const { name, value } = e.target;
    setSupplierFormData({ ...supplierFormData, [name]: value });
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
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

      const fetchSuppliers = async () => {
        const response = await axios.get(`${baseUrl}/api/supplier`);
        setSuppliers(response.data.suppliers);
      };
      fetchSuppliers();
    } catch (error) {
      console.error("Error creating supplier:", error);
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      const response = await axios.get(`${baseUrl}/api/supplier`);
      setSuppliers(response.data.suppliers);
    };
    fetchSuppliers();
  }, []);

  const fetchStaffs = async () => {
    const response = await axios.get(`${baseUrl}/api/users`, {
      params: { role: "staff" },
    });
    setStaffs(response.data.users);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}/api/users`, newStaff, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        });
        fetchStaffs();
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast.error(error.response?.data?.message || "Failed to create staff");
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      const response = await axios.get(`${baseUrl}/api/supplier`);
      setSuppliers(response.data.suppliers);
    };
    fetchSuppliers();

    const fetchStaffs = async () => {
      const response = await axios.get(`${baseUrl}/api/users`, {
        params: { role: "staff" },
      });
      setStaffs(response.data.users);
    };
    fetchStaffs();
  }, []);

  const token = localStorage.getItem("token");

  const handleToggle = async (supplierId) => {
    try {
      const token = localStorage.getItem("token");
      const supplier = suppliers.find((s) => s.id === supplierId);

      if (!supplier) {
        toast.error("Supplier not found");
        return;
      }

      // Toggle the `active` status locally
      const updatedSupplier = { ...suppliers, active: !supplier.active };

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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold mb-4">Suppliers</h2>
          <button
            onClick={openSupplierModal}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200"
          >
            Create Supplier
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Contact Person</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Action</th>
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
                  <button onClick={() => handleToggle(supplier.id)}>
                    <FontAwesomeIcon
                      icon={supplier.active ? faToggleOn : faToggleOff}
                      className={`text-2xl ${
                        supplier.active ? "text-green-500" : "text-red-900"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Staffs</h2>
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200"
          >
            Add Staff
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id} className="border-t">
                <td className="p-3">{staff.username}</td>
                <td className="p-3">{staff.email}</td>
                <td className="p-3">{staff.phone}</td>
                <td className="p-3">{staff.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              <label className="block text-sm font-medium mb-1">Address</label>
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

      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
      >
        <h3 className="text-lg font-bold mb-4">Create New Staff</h3>
        <form onSubmit={handleAddStaff}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                value={newStaff.username}
                placeholder="Enter a non-exisiting username"
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
              <label className="block text-sm font-medium mb-1">Password</label>
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
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full border rounded-md px-3 bg-transparent py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
                value={"staff"}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, role: e.target.value })
                }
              >
                <option defaultChecked value="staff">
                  Staff
                </option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Create Staff
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
