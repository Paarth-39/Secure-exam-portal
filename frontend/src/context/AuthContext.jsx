import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Helper function to decode JWT payload using atob
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (token) => {
    localStorage.setItem('accessToken', token);
    const decoded = decodeToken(token);
    setAccessToken(token);
    setUser(decoded); // contains { userId, email, role }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Fallback clean if network request fails
    } finally {
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        const decoded = decodeToken(storedToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setAccessToken(storedToken);
          setUser(decoded);
        } else {
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
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

export default AuthContext;
