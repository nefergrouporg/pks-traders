import React from 'react'
import Modal from '../POSInterface/Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}


const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    message,
  }) => {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto z-[2000]"
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Confirm Delete</h2>
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
              className="bg-red-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-red-600 transition text-sm sm:text-base"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  export default DeleteConfirmationModal