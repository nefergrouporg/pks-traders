import React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Stepper, { Step } from "../Stepper";
import moneyClipart from "../../assets/money_clipart.png";
import cardsClipart from "../../assets/cards_clipart.png";

interface PaymentStepperProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: "cash" | "card" | "upi" | undefined;
  setSelectedPaymentMethod: (method: "cash" | "card" | "upi") => void;
  currentStepperStep: number;
  setCurrentStepperStep: (step: number) => void;
  paymentQR: string | null;
  onPaymentConfirm: () => void;
  showReceiptPreview: () => void;
  handleAutomaticPrintAndDownload: () => void;
  createPendingSale: (method: "cash" | "card" | "upi") => Promise<any>;
  setCurrentSaleId: (id: number) => void;
  setPendingSale: (sale: any) => void;
}

const PaymentStepper: React.FC<PaymentStepperProps> = ({
  isOpen,
  onClose,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  currentStepperStep,
  setCurrentStepperStep,
  paymentQR,
  onPaymentConfirm,
  showReceiptPreview,
  handleAutomaticPrintAndDownload,
  createPendingSale,
  setCurrentSaleId,
  setPendingSale,
}) => {
  if (!isOpen) return null;

  const handlePaymentMethodSelect = async (method: "cash" | "card" | "upi") => {
    setSelectedPaymentMethod(method);
    
    try {
      const sale = await createPendingSale(method);
      if (sale) {
        setCurrentSaleId(sale.id);
        setPendingSale(sale);
      }
      setCurrentStepperStep(2); // Move to next step
    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error(error);
    }
  };

  return (
    <motion.div
      key="stepper-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white relative"
      >
        <Stepper
          initialStep={1}
          onClose={onClose}
          onStepChange={(step) => setCurrentStepperStep(step)}
          onFinalStepCompleted={onPaymentConfirm}
          nextButtonText={
            currentStepperStep === 2 && selectedPaymentMethod === "upi"
              ? "Verify"
              : undefined
          }
          nextButtonProps={{
            disabled: currentStepperStep === 1 && !selectedPaymentMethod,
          }}
        >
          <Step>
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Select Payment Method</h2>
              <button
                onClick={() => handlePaymentMethodSelect("cash")}
                className={`p-2 rounded flex items-center gap-2 ${
                  selectedPaymentMethod === "cash"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <img src={moneyClipart} alt="Cash" className="h-8 w-8" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("card")}
                className={`p-2 rounded flex items-center gap-2 ${
                  selectedPaymentMethod === "card"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <img src={cardsClipart} alt="Card" className="h-8 w-8" />
                <span>Card</span>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("upi")}
                className={`p-2 rounded flex items-center gap-2 ${
                  selectedPaymentMethod === "upi"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M10.5 15.5v-7h3v7h-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span>UPI</span>
              </button>
            </div>
          </Step>
          <Step>
            {selectedPaymentMethod === "cash" && (
              <div className="text-center">
                <img
                  src={moneyClipart}
                  alt="Cash"
                  className="mx-auto h-32 sm:h-40 w-32 sm:w-40"
                />
                <button
                  className="mt-4 mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={handleAutomaticPrintAndDownload}
                >
                  VIEW RECEIPT
                </button>
                <p className="mt-2 text-sm sm:text-base">
                  Order successfully created. Please collect the cash.
                </p>
              </div>
            )}
            {selectedPaymentMethod === "card" && (
              <div className="text-center">
                <img
                  src={cardsClipart}
                  alt="Card"
                  className="mx-auto h-32 sm:h-40 w-32 sm:w-40"
                />
                <button
                  className="mt-4 mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={showReceiptPreview}
                >
                  VIEW RECEIPT
                </button>
                <p className="mt-2 text-sm sm:text-base">
                  Order successfully created. Please verify the payment.
                </p>
              </div>
            )}
            {selectedPaymentMethod === "upi" && (
              <div className="text-center">
                {paymentQR ? (
                  <>
                    <img
                      src={paymentQR}
                      alt="QR Code"
                      className="mx-auto h-40 sm:h-48 w-40 sm:w-48"
                    />
                    <button
                      className="mt-4 mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={showReceiptPreview}
                    >
                      VIEW RECEIPT
                    </button>
                    <p className="mt-4 text-sm sm:text-base">
                      Order successfully created. Please verify the payment.
                    </p>
                  </>
                ) : (
                  <p className="text-sm sm:text-base">Generating QR code...</p>
                )}
              </div>
            )}
          </Step>
        </Stepper>
      </motion.div>
    </motion.div>
  );
};

export default PaymentStepper;