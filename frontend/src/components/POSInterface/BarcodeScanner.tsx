import React, { useState, useRef } from "react";
import Lottie from "lottie-react";
import scanningAnimation from "../../assets/lottie/scanner.json"; // Replace with your Lottie JSON file path

const BarcodeScanner: React.FC<{ onScan: (barcode: string) => void }> = ({ onScan }) => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null); // To detect outside clicks

  // Handle barcode input from hidden field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scannedCode = e.target.value.trim();
    if (scannedCode) {
      onScan(scannedCode);
      setBarcode(scannedCode);
      e.target.value = ""; // Reset input after scanning
    }
  };

  return (
    <div ref={scannerRef} className="scanner-feed p-4 border rounded-md">
      <h3 className="text-lg font-bold mb-2">Barcode Scanner</h3>

      {scanning && (
        <>
          <div className="w-32 h-32 mx-auto">
            <Lottie animationData={scanningAnimation} loop autoPlay />
          </div>
          <p className="mb-2">Scanned Code: {barcode}</p>
        </>
      )}

      {/* Hidden input field for barcode scanning */}
      <input
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        autoFocus={scanning}
        className="absolute opacity-0"
      />

      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={() => {
              setScanning(true);
              setBarcode("");
              inputRef.current?.focus(); // Focus input when scanning starts
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={() => {
              setScanning(false);
              setBarcode(""); // Clear barcode when stopping
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;



// import React, { useState, useEffect, useRef } from "react";
// import Lottie from "lottie-react";
// import scanningAnimation from "../../assets/lottie/scanner.json"; // Replace with your Lottie JSON file path

// const BarcodeScanner: React.FC<{ onScan: (barcode: string) => void }> = ({
//   onScan,
// }) => {
//   const [barcode, setBarcode] = useState("");
//   const [scanning, setScanning] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const scannerRef = useRef<HTMLDivElement>(null); // To detect outside clicks

//   useEffect(() => {
//     const handleKeyPress = (e: KeyboardEvent) => {
//       if (!scanning) return;

//       if (e.key === "Enter") {
//         if (barcode.trim()) {
//           onScan(barcode);
//           setBarcode(""); // Reset barcode after scanning
//         }
//       } else {
//         setBarcode((prev) => prev + e.key);
//       }
//     };

//     if (scanning) {
//       window.addEventListener("keydown", handleKeyPress);
//     } else {
//       window.removeEventListener("keydown", handleKeyPress);
//     }

//     return () => window.removeEventListener("keydown", handleKeyPress);
//   }, [barcode, scanning]);

//   // Detects clicks outside of the scanner component
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         scannerRef.current &&
//         !scannerRef.current.contains(event.target as Node)
//       ) {
//         setScanning(false);
//         setBarcode(""); // Clear barcode when stopping
//       }
//     };

//     if (scanning) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [scanning]);

//   // Prevent Enter key from triggering button click
//   const preventEnterKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//     }
//   };

//   return (
//     <div ref={scannerRef} className="scanner-feed p-4 border rounded-md">
//       <h3 className="text-lg font-bold mb-2">Barcode Scanner</h3>

//       {scanning && (
//         <>
//           <div className="w-32 h-32 mx-auto">
//             <Lottie animationData={scanningAnimation} loop autoPlay/>
//           </div>
//           <p className="mb-2">Scanned Code: {barcode}</p>
//         </>
//       )}

//       <input
//         ref={inputRef}
//         type="text"
//         value={barcode}
//         readOnly
//         placeholder="Click 'Start Scanning' and scan"
//         className="border p-2 w-full mb-3 hidden"
//       />

//       <div className="flex gap-2">
//         {!scanning ? (
//           <button
//             onClick={() => {
//               setScanning(true);
//               inputRef.current?.focus(); // Auto-focus input when scanning starts
//             }}
//             onKeyDown={preventEnterKey}
//             className="bg-blue-500 text-white px-4 py-2 rounded-md"
//           >
//             Start Scanning
//           </button>
//         ) : (
//           <button
//             onClick={() => {
//               setScanning(false);
//               setBarcode(""); // Clear barcode when stopping
//             }}
//             onKeyDown={preventEnterKey}
//             className="bg-red-500 text-white px-4 py-2 rounded-md"
//           >
//             Stop Scanning
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default BarcodeScanner;
