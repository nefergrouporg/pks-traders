import React, { useState, useRef, useEffect } from "react";

const BarcodeScanner: React.FC<{ onScan: (barcode: string) => void }> = ({
  onScan,
}) => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scannedCode = e.target.value;
    setBarcode(scannedCode);

    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }

    scanTimeout.current = setTimeout(() => {
      if (scannedCode) {
        onScan(scannedCode);
        e.target.value = "";
        setBarcode("");
      }
    }, 100);
  };

  useEffect(() => {
    if (scanning) {
      inputRef.current?.focus();
    }
  }, [scanning]);

  return (
    <div className="relative">
      {/* Hidden input for scanning */}
      <input
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        autoFocus={scanning}
        className="absolute opacity-0 pointer-events-none"
      />

      {/* Scanner Toggle Button */}
      <button
        onClick={() => {
          setScanning((prev) => !prev);
          setBarcode("");
          if (!scanning) {
            inputRef.current?.focus();
          }
        }}
        className={`w-32 px-4 py-2 rounded-md transition-all duration-300 
          ${
            scanning
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } 
          text-white text-sm`}
      >
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>
    </div>
  );
};

export default BarcodeScanner;
