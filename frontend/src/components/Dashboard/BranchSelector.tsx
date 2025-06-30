import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../../../utils/services";
import { useAuth } from "../../context/AuthContext";

interface Branch {
  id: number;
  name: string;
  status: boolean;
  isDeleted: boolean;
}

interface BranchSelectorProps {
  selectedBranchId: number | null;
  onBranchChange: (branchId: number | null) => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({
  selectedBranchId,
  onBranchChange,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { role, branch } = useAuth();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/branches`);
      setBranches(response.data.branches.filter((b: Branch) => b.status && !b.isDeleted));
      
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "all") {
      onBranchChange(null);
    } else {
      onBranchChange(parseInt(value));
    }
  };

  // Only show branch selector for admin users
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          Select Branch:
        </label>
        <select
          value={selectedBranchId || "all"}
          onChange={handleBranchChange}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[200px]"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        {isLoading && (
          <span className="text-sm text-gray-500">Loading branches...</span>
        )}
      </div>
    </div>
  );
};

export default BranchSelector; 