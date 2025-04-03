import React, { useState } from "react";
import Modal from "./POSInterface/Modal";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { baseUrl } from "../../utils/services";

const UpiIdComponent = () => {
  const { upiId, setUpiId, fetchUpiId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");

  const openModal = () => {
    setIsModalOpen(true);
    setNewUpiId(upiId || "");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewUpiId("");
  };

  const isValidUpiId = (upiId: string) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  };

  const token = localStorage.getItem('token')

  const handleSetUpiId = async () => {
  
    if (!isValidUpiId(newUpiId)) {
      toast.error("Invalid UPI ID format");
      return;
    }
    const response = await axios.post(`${baseUrl}/api/config/upi-id`, {upiId: newUpiId},{
      headers:{
        Authorization : `Bearer ${token}`
      }
    })
    try {
      await setUpiId(newUpiId);
      toast.success("UPI ID updated successfully");
      closeModal();
    } catch (error) {
      toast.error("Failed to update UPI ID");
      console.error(error);
    }
  };

  return (
    <div>
      <p className="text-base sm:text-lg font-medium text-gray-700">
        Current UPI ID:{" "}
        <span className="font-semibold text-gray-900">
          {upiId || "Not set"}
        </span>
      </p>

      <button
        onClick={openModal}
        className="mt-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md shadow-md transition duration-200 text-sm sm:text-base"
      >
        {upiId ? "Update UPI ID" : "Set UPI ID"}
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="space-y-4 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold">
            {upiId ? "Update UPI ID" : "Set UPI ID"}
          </h2>
          <input
            type="text"
            value={newUpiId}
            onChange={(e) => setNewUpiId(e.target.value)}
            placeholder="Enter UPI ID (e.g., yourname@upi)"
            className="w-full p-2 border bg-transparent border-gray-300 rounded-lg text-sm sm:text-base"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSetUpiId}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UpiIdComponent;