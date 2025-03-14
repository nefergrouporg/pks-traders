import React, { useState } from 'react';

// Reusable Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="float-right text-gray-500 hover:text-gray-700">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// User Management Page
const UserManagement: React.FC = () => {
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState<{ [key: number]: boolean }>({});
  const [activeSessions, setActiveSessions] = useState<{ [key: number]: string[] }>({});

  // Dummy user data
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
    { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'Viewer' },
  ];

  // Dummy activity log data
  const activityLogs = [
    { id: 1, userId: 1, action: 'Logged in', timestamp: '2023-10-01 10:00 AM' },
    { id: 2, userId: 2, action: 'Updated profile', timestamp: '2023-10-01 11:00 AM' },
    { id: 3, userId: 3, action: 'Viewed dashboard', timestamp: '2023-10-01 12:00 PM' },
  ];

  // Dummy role permissions matrix
  const rolePermissions = [
    { role: 'Admin', permissions: ['Create', 'Read', 'Update', 'Delete'] },
    { role: 'Editor', permissions: ['Create', 'Read', 'Update'] },
    { role: 'Viewer', permissions: ['Read'] },
  ];

  // Handle password reset
  const handlePasswordReset = (userId: number) => {
    setSelectedUserId(userId);
    setIsPasswordResetModalOpen(true);
  };

  // Toggle 2FA for a user
  const toggleTwoFA = (userId: number) => {
    setTwoFAEnabled((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Manage active sessions for a user
  const manageSessions = (userId: number) => {
    setActiveSessions((prev) => ({
      ...prev,
      [userId]: prev[userId] ? [] : ['Session 1', 'Session 2'], // Dummy session data
    }));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">User Management (Admin Only)</h1>

      {/* Role Permissions Matrix */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Role Permissions Matrix</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {rolePermissions.map((role) => (
              <tr key={role.role} className="border-t">
                <td className="p-3">{role.role}</td>
                <td className="p-3">{role.permissions.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Activity Log</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-3">{users.find((user) => user.id === log.userId)?.name}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User List with Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3 flex space-x-4">
                  <button
                    onClick={() => handlePasswordReset(user.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => toggleTwoFA(user.id)}
                    className={`${
                      twoFAEnabled[user.id] ? 'text-green-500' : 'text-gray-500'
                    } hover:text-green-700`}
                  >
                    {twoFAEnabled[user.id] ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                  <button
                    onClick={() => manageSessions(user.id)}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    {activeSessions[user.id] ? 'End Sessions' : 'Manage Sessions'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal */}
      <Modal isOpen={isPasswordResetModalOpen} onClose={() => setIsPasswordResetModalOpen(false)}>
        <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
        <p className="text-gray-500 mb-4">
          Are you sure you want to reset the password for user ID {selectedUserId}?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setIsPasswordResetModalOpen(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Password reset for user ID ${selectedUserId}`);
              setIsPasswordResetModalOpen(false);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Reset
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;