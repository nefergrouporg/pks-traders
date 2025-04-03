import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../../utils/services';
import { toast } from 'sonner';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  status: boolean;
}

const BranchAddress: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      fetchBranches();
    }
  }, [isModalOpen]);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/branches`);
      setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('Failed to fetch branches');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBranchStatus = async (id: number, status: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseUrl}/api/branches/${id}`, 
        { isActive: !status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Branch status updated');
      fetchBranches();
    } catch (error) {
      console.error('Failed to update branch status:', error);
      toast.error('Failed to update branch status');
    }
  };

  const createBranch = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${baseUrl}/api/branches`, newBranch, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Branch created successfully');
      setNewBranch({ name: '', address: '', phone: '' });
      setShowCreateForm(false);
      fetchBranches();
    } catch (error) {
      console.error('Failed to create branch:', error);
      toast.error('Failed to create branch');
    }
  };

  return (
    <div className="relative">
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 transition-colors w-full md:w-auto"
        onClick={() => setIsModalOpen(true)}
      >
        Manage Branches
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] p-4">
          {/* Modal container with left margin to account for sidebar */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ml-0 lg:ml-64">
            <div className="flex justify-between items-center border-b border-gray-200 px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Branch Management</h2>
              <button 
                className="text-gray-500 hover:text-red-500 transition-colors text-xl"
                onClick={() => {
                  setIsModalOpen(false);
                  setShowCreateForm(false);
                }}
              >
                &times;
              </button>
            </div>

            <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">Loading...</div>
              ) : branches.length === 0 ? (
                <div className="text-center py-16">No branches found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-2 sm:px-4 text-left font-semibold text-gray-700 border-b text-sm sm:text-base">Branch Name</th>
                        <th className="py-2 px-2 sm:px-4 text-left font-semibold text-gray-700 border-b text-sm sm:text-base">Address</th>
                        <th className="py-2 px-2 sm:px-4 text-left font-semibold text-gray-700 border-b text-sm sm:text-base">Contact</th>
                        <th className="py-2 px-2 sm:px-4 text-left font-semibold text-gray-700 border-b text-sm sm:text-base">Status</th>
                        <th className="py-2 px-2 sm:px-4 text-left font-semibold text-gray-700 border-b text-sm sm:text-base">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map(branch => (
                        <tr key={branch.id} className={`border-b ${!branch.status ? 'bg-gray-50 text-gray-500' : ''}`}>
                          <td className="py-2 px-2 sm:px-4 bg-white text-black text-sm sm:text-base">{branch.name}</td>
                          <td className="py-2 px-2 sm:px-4 bg-white text-black text-sm sm:text-base">{branch.address}</td>
                          <td className="py-2 px-2 sm:px-4 bg-white text-black text-sm sm:text-base">{branch.phone}</td>
                          <td className="py-2 px-2 sm:px-4 bg-white text-black">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              branch.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {branch.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <button 
                              className="px-2 sm:px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors text-sm sm:text-base"
                              onClick={() => toggleBranchStatus(branch.id, branch.status)}
                            >
                              {branch.status ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 sm:mt-6">
                {!showCreateForm ? (
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full sm:w-auto"
                  >
                    Create New Branch
                  </button>
                ) : (
                  <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-md sm:text-lg font-semibold text-white mb-3">Add New Branch</h3>
                    <input 
                      type="text" 
                      placeholder="Branch Name" 
                      value={newBranch.name} 
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} 
                      className="bg-black text-white border border-gray-600 p-2 w-full mb-2 rounded text-sm sm:text-base" 
                    />
                    <input 
                      type="text" 
                      placeholder="Address" 
                      value={newBranch.address} 
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} 
                      className="bg-black text-white border border-gray-600 p-2 w-full mb-2 rounded text-sm sm:text-base" 
                    />
                    <input 
                      type="text" 
                      placeholder="Contact Number" 
                      value={newBranch.phone} 
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} 
                      className="bg-black text-white border border-gray-600 p-2 w-full mb-2 rounded text-sm sm:text-base" 
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={createBranch} 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex-1"
                      >
                        Create Branch
                      </button>
                      <button 
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewBranch({ name: '', address: '', phone: '' });
                        }} 
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchAddress;   