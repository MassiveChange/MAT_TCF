import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageService } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  updateCredentials: (u: string, p: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if already logged in session exists (optional, for now we force login on refresh or keep state if we want persistent login)
  // For higher security in this demo, we might not persist "isLoggedIn" state in localStorage to force login on refresh,
  // OR we can persist a simple flag. Let's persist a simple session flag for better UX.
  useEffect(() => {
    const session = sessionStorage.getItem('tcf_app_session');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (u: string, p: string) => {
    const creds = StorageService.getAuth();
    if (u === creds.username && p === creds.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem('tcf_app_session', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('tcf_app_session');
  };

  const updateCredentials = (u: string, p: string) => {
    StorageService.saveAuth({ username: u, password: p });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, updateCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};