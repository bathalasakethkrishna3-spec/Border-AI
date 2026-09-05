import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('borderai_user') || localStorage.getItem('border_ai_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('borderai_token') || localStorage.getItem('border_ai_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('borderai_token') || localStorage.getItem('border_ai_token');
      if (savedToken) {
        try {
          const res = await authAPI.getCurrentUser();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('borderai_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification note:', err);
          // Only clear if server explicitly returned 401
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      setToken(receivedToken);
      setUser(receivedUser);
      
      localStorage.setItem('borderai_token', receivedToken);
      localStorage.setItem('borderai_user', JSON.stringify(receivedUser));
      localStorage.setItem('border_ai_token', receivedToken);
      localStorage.setItem('border_ai_user', JSON.stringify(receivedUser));
      
      return { success: true, user: receivedUser };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed. Please check credentials.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (e) {
      console.warn('Logout API call notice:', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('borderai_token');
      localStorage.removeItem('borderai_user');
      localStorage.removeItem('border_ai_token');
      localStorage.removeItem('border_ai_user');
    }
  };

  const normalizedRole = (user?.role || '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR';
  const isOperator = normalizedRole === 'OPERATOR';
  const isAnalyst = normalizedRole === 'ANALYST';
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      isAdmin, 
      isOperator, 
      isAnalyst, 
      role: user?.role || 'Operator', 
      loading, 
      login, 
      logout 
    }}>
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
