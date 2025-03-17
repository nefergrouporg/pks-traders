import axios from "axios";
import React, { useState } from "react";
import { baseUrl } from "../../../utils/services";
import { toast } from "sonner";

const DownloadReportButton = () => {
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");

  // Validation function
  const validateDates = () => {
    if (!selectedStartDate || !selectedEndDate) {
      toast.error("Both Start Date and End Date are required!");
      return false;
    }
    return true;
  };

  const handleDownload = async (format) => {
    if (!validateDates()) {
      return;
    }
    try {
      const response = await axios.get(
        `${baseUrl}/api/dashboard/export-sales-data`,
        {
          params: {
            startDate: selectedStartDate,
            endDate: selectedEndDate,
            format: format,
          },
          responseType: "blob",
        }
      );

      const extension = format === "xlsx" ? "xlsx" : "csv";
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales-data-${new Date().toISOString()}.${extension}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  return (
    <div className="flex justify-end gap-4 mb-6">
      <input
        type="date"
        value={selectedStartDate}
        onChange={(e) => setSelectedStartDate(e.target.value)}
        className="p-2 border rounded-lg bg-white"
      />
      <input
        type="date"
        value={selectedEndDate}
        onChange={(e) => setSelectedEndDate(e.target.value)}
        className="p-2 border rounded-lg bg-white"
      />

      <div className="relative group">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center">
          Download Report
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div className="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-lg mt-1">
          <button
            onClick={() => handleDownload("csv")}
            className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
          >
            Download CSV
          </button>
          <button
            onClick={() => handleDownload("xlsx")}
            className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
          >
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadReportButton;
