import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  role: string | null;
  username: string | null;
  setRole: (role: string | null) => void;
  setUsername: (role: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  username: null,
  setRole: () => {},
  setUsername: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};