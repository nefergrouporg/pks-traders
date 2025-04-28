// ConfirmationModal.tsx
import React from "react";
import Modal from "../POSInterface/Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  currentStatus: boolean;
  title: string; // ✅ add this
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  currentStatus,
}) => {
  const action = currentStatus ? "Unblock" : "Block";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto"
    >
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Confirm {action}
        </h2>
        <p className="mb-6 text-sm sm:text-base">{message}</p>
        <div className="flex justify-end space-x-3 sm:space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${
              !currentStatus ? "bg-red-500" : "bg-green-500"
            } text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:${
              !currentStatus ? "bg-red-600" : "bg-green-600"
            } transition text-sm sm:text-base`}
          >
            {action}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
