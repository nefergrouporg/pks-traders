import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Stepper, { Step } from "../Stepper";
import moneyClipart from "../../assets/money_clipart.png";
import cardsClipart from "../../assets/cards_clipart.png";
import { TrendingDown } from "lucide-react";
import { Customer } from "../../pages/POSInterface";

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
  createPendingSale: (method: "cash" | "card" | "upi" | "debt") => Promise<any>;
  setCurrentSaleId: (id: number) => void;
  setPendingSale: (sale: any) => void;
  selectedCustomer: Customer | null;
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
  selectedCustomer,
}) => {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [tempPaymentMethod, setTempPaymentMethod] = useState<
    "cash" | "card" | "upi" | "debt"
  >(selectedPaymentMethod || "cash");

  const paymentMethodsRef = useRef<HTMLDivElement>(null);

  const paymentOptions = [
    {
      method: "cash",
      label: "Cash",
      icon: <img src={moneyClipart} alt="Cash" className="h-8 w-8" />,
    },
    {
      method: "card",
      label: "Card",
      icon: <img src={cardsClipart} alt="Card" className="h-8 w-8" />,
    },
    {
      method: "upi",
      label: "UPI",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M10.5 15.5v-7h3v7h-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
        </svg>
      ),
    },
    { method: "debt", label: "Debt", icon: <TrendingDown /> },
  ];

  const handlePaymentMethodSelect = (
    method: "cash" | "card" | "upi" | "debt"
  ): boolean => {
    console.log(`Attempting to select payment method: ${method}`);
    if (method === "debt" && selectedCustomer === null) {
      toast.error("Please select a customer first");
      console.log("Selection failed: No customer selected for debt");
      return false;
    }
    setSelectedPaymentMethod(method);
    console.log(`Selected payment method: ${method}`);
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || currentStepperStep !== 1) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % paymentOptions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + paymentOptions.length) % paymentOptions.length
        );
        break;
      case "Enter":
        e.preventDefault();
        const method = paymentOptions[highlightedIndex]
          .method as typeof tempPaymentMethod;
        if (method === "debt" && !selectedCustomer) {
          toast.error("Please select a customer first");
          return;
        }
        setTempPaymentMethod(method);
        setSelectedPaymentMethod(method);
        handleStepChange(2, method); // Pass the method directly
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen && currentStepperStep === 1) {
      const timer = setTimeout(() => {
        paymentMethodsRef.current?.focus();
        setHighlightedIndex(
          paymentOptions.findIndex((opt) => opt.method === tempPaymentMethod)
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStepperStep]);

  const handleStepChange = async (
    newStep: number,
    selectedMethod?: typeof tempPaymentMethod
  ) => {
    const method = selectedMethod || tempPaymentMethod;
    if (newStep === 2) {
      if (!method) {
        toast.error("Please select a payment method first");
        return;
      }

      // For UPI specifically
      if (method === "upi" && !paymentQR) {
        try {
          setIsGeneratingQR(true);
          const response = await createPendingSale(method);
          if (response?.paymentQR) {
            setPaymentQR(response.paymentQR);
            setCurrentStepperStep(2);
          }
        } catch (error) {
          toast.error("Failed to initialize UPI payment");
        } finally {
          setIsGeneratingQR(false);
        }
      } else {
        setCurrentStepperStep(newStep);
      }
    } else {
      setCurrentStepperStep(newStep);
    }
  };

  const handleFinalStep = async () => {
    console.log("Handling final step...");
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method first");
      console.log("Final step failed: No payment method selected");
      return;
    }
    try {
      if (selectedPaymentMethod !== "upi") {
        console.log(`Creating pending sale for: ${selectedPaymentMethod}`);
        await createPendingSale(selectedPaymentMethod);
        showReceiptPreview();
        console.log("Receipt preview shown");
      } else {
        onPaymentConfirm();
        console.log("UPI payment confirmed");
      }
    } catch (error) {
      console.error("Final step error:", error);
    }
  };
  useEffect(() => {
    if (isOpen && currentStepperStep === 1) {
      // Add slight delay to ensure focus is applied
      setTimeout(() => paymentMethodsRef.current?.focus(), 50);
    }
  }, [isOpen, currentStepperStep]);

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
        className="rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md relative"
      >
        <Stepper
          key={currentStepperStep} // Add this line to force re-render on step change
          initialStep={currentStepperStep}
          onFinalStepCompleted={handleFinalStep}
          onStepChange={handleStepChange}
          nextButtonText={
            currentStepperStep === 2 ? "Confirm Payment" : undefined
          }
          onClose={() => {
            onClose();
            setTempPaymentMethod("cash"); // Set to default payment method
          }}
          selectedCustomer={selectedCustomer}
          paymentMethod={selectedPaymentMethod}
        >
          <Step>
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Select Payment Method</h2>
              <div
                ref={paymentMethodsRef}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                className="focus:outline-none flex flex-col gap-2"
              >
                {paymentOptions.map((option, index) => (
                  <button
                    key={option.method}
                    onClick={() => {
                      const method = option.method as typeof tempPaymentMethod;
                      setHighlightedIndex(index);
                      if (handlePaymentMethodSelect(method)) {
                        setTempPaymentMethod(method); // Update local state
                        handleStepChange(2, method); // Pass method directly
                      }
                    }}
                    className={`p-2 rounded flex items-center gap-2 w-full text-left transition-colors ${
                      tempPaymentMethod === option.method
                        ? "bg-blue-500 text-white"
                        : index === highlightedIndex
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
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
