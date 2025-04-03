import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUpiId, setUpiId } from '../../utils/services';

type AuthContextType = {
  role: string | null;
  username: string | null;
  upiId: string | null;
  setRole: (role: string | null) => void;
  setUsername: (username: string | null) => void;
  setUpiId: (upiId: string | null) => Promise<void>;
  fetchUpiId: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  username: null,
  upiId: null,
  setRole: () => {},
  setUsername: () => {},
  setUpiId: async () => {},
  fetchUpiId: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [upiId, setUpiIdState] = useState<string | null>(null);

  // Function to fetch UPI ID from backend
  const fetchUpiId = async () => {
    try {
      const id = await getUpiId();
      setUpiIdState(id);
    } catch (error) {
      console.error("Failed to fetch UPI ID:", error);
      setUpiIdState(null);
    }
  };

  // Wrapper function to update both backend and state
  const updateUpiId = async (newUpiId: string | null) => {
    try {
      if (newUpiId) {
        await setUpiId(newUpiId);
      }
      setUpiIdState(newUpiId);
    } catch (error) {
      console.error("Failed to set UPI ID:", error);
      throw error; // Re-throw to handle in component
    }
  };

  // Fetch UPI ID when the provider mounts
  useEffect(() => {
    fetchUpiId();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      role, 
      setRole, 
      username, 
      setUsername, 
      upiId, 
      setUpiId: updateUpiId,
      fetchUpiId 
    }}>
      {children}
    </AuthContext.Provider>
  );
};