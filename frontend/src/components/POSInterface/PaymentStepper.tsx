import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Stepper, { Step } from "../Stepper";
import moneyClipart from "../../assets/money_clipart.png";
import cardsClipart from "../../assets/cards_clipart.png";
import { TrendingDown } from "lucide-react";

interface PaymentStepperProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: "cash" | "card" | "upi" | "debt" | undefined;
  setSelectedPaymentMethod: (method: "cash" | "card" | "upi" | "debt") => void;
  currentStepperStep: number;
  setCurrentStepperStep: (step: number) => void;
  paymentQR: string | null;
  onPaymentConfirm: () => void;
  showReceiptPreview: () => void;
  handleAutomaticPrintAndDownload: () => void;
  createPendingSale: (
    method: "cash" | "card" | "upi" | "debt"
  ) => Promise<any>;
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
  const [tempPaymentMethod, setTempPaymentMethod] = useState<
    "cash" | "card" | "upi" | "debt"
  >();
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const handlePaymentMethodSelect = (
    method: "cash" | "card" | "upi" | "debt"
  ) => {
    setTempPaymentMethod(method);
    setSelectedPaymentMethod(method);
  };

  const handleStepChange = async (newStep: number) => {
    if (newStep === 2 && selectedPaymentMethod === "upi" && !paymentQR) {
      try {
        setIsGeneratingQR(true);
        const response = await createPendingSale("upi");
        if (response?.paymentQR) {
          setCurrentSaleId(response.sale.id);
          setPendingSale(response.sale);
          // setCurrent;
          // StepperStep(2); // Move to QR step
        } else {
          toast.error("Failed to generate UPI QR code");
          setCurrentStepperStep(1);
        }
      } catch (error) {
        toast.error("Failed to generate UPI QR code");
        setCurrentStepperStep(1);
      } finally {
        setIsGeneratingQR(false);
      }
    } else {
      setCurrentStepperStep(newStep);
    }
  };

  const handleFinalStep = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method first");
      return;
    }

    try {
      if (selectedPaymentMethod !== "upi") {
        await createPendingSale(selectedPaymentMethod);
        onPaymentConfirm();
        onClose();
      } else {
        // For UPI, payment confirmation happens after QR scan
        onPaymentConfirm();
        // Don’t close yet, let user view receipt
      }
    } catch (error) {
      toast.error("Failed to complete payment");
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      key="stepper-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md  relative"
      >
        {/* <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
        >
          ×
        </button> */}
        <Stepper
          initialStep={currentStepperStep}
          onFinalStepCompleted={handleFinalStep}
          onStepChange={handleStepChange}
          nextButtonText={
            currentStepperStep === 2 ? "Confirm Payment" : undefined
          }
          onClose={onClose}
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
                  <path
                    fill="currentColor"
                    d="M10.5 15.5v-7h3v7h-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  />
                </svg>
                <span>UPI</span>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("debt")}
                className={`p-2 rounded flex items-center gap-2 ${
                  selectedPaymentMethod === "debt"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <TrendingDown />
                <span>Debt</span>
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
                  onClick={showReceiptPreview}
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
                {isGeneratingQR ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-pulse bg-gray-200 h-40 w-40 rounded-lg" />
                    <p className="text-sm sm:text-base">
                      Generating QR code...
                    </p>
                  </div>
                ) : paymentQR ? (
                  <>
                    <img
                      src={paymentQR}
                      alt="QR Code"
                      className="mx-auto h-40 sm:h-48 w-40 sm:w-48 border-2 border-gray-300 rounded-lg"
                    />
                    <div className="mt-4 space-y-2">
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
                        onClick={showReceiptPreview}
                      >
                        VIEW RECEIPT
                      </button>
                      <p className="text-sm text-gray-600">
                        Scan the QR code to complete payment
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-red-500">Failed to generate QR code</p>
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
