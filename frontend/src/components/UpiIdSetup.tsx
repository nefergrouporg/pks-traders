import React, { useEffect, useState } from "react";
import { getUpiId, setUpiId } from "../../utils/services";
import Modal from "./POSInterface/Modal";
import { toast } from "sonner";

const UpiIdComponent = () => {
  const [upiId, setUpiIdState] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [newUpiId, setNewUpiId] = useState(""); // State to store the new UPI ID input

  // Fetch UPI ID on component mount
  useEffect(() => {
    const fetchUpiId = async () => {
      const id = await getUpiId();
      setUpiIdState(id);
    };
    fetchUpiId();
  }, []);

  // Open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setNewUpiId(""); // Reset the input field
  };

  const isValidUpiId = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  };

  // Handle setting the UPI ID
  const handleSetUpiId = async () => {
    if (!isValidUpiId(newUpiId)) {
      toast.error("Invalid UPI ID format");
      return
    }
    if (newUpiId) {
      await setUpiId(newUpiId);
      setUpiIdState(newUpiId);
      closeModal(); // Close the modal after setting the UPI ID
    }
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-700">
        Current UPI ID:{" "}
        <span className="font-semibold text-gray-900">{upiId}</span>
      </p>
      <button
        onClick={openModal}
        className="mt-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md shadow-md transition duration-200"
      >
        Set UPI ID
      </button>

      {/* Modal for setting UPI ID */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Set UPI ID</h2>
          <input
            type="text"
            value={newUpiId}
            onChange={(e) => setNewUpiId(e.target.value)}
            placeholder="Enter new UPI ID"
            className="w-full p-2 border bg-transparent border-gray-300 rounded-lg"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSetUpiId}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
