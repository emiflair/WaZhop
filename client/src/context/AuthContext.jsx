/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getMe();
          // Extract user from response.data since API returns { success: true, data: user }
          const userData = response?.data || response;
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // Support two shapes:
      // 1) { token, user } when backend chooses to auto-login (legacy)
      // 2) { success, pendingVerification, message } for verify-before-login
      if (response?.token && response?.user) {
        const { token, user: newUser } = response;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
        return { success: true, user: newUser };
      }

      // Pending verification path (no token returned)
      if (response?.pendingVerification) {
        // Store the email to help with verification/resend flows
        if (userData?.email) {
          localStorage.setItem('pendingVerifyEmail', userData.email.trim().toLowerCase());
        }
        return { success: true, pendingVerification: true };
      }

      // Fallback: treat as success without login
      return { success: true, pendingVerification: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      const errors = error.response?.data?.errors || [];
      return { success: false, error: message, errors };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        return { success: false, requires2FA: true, error: response.message };
      }

      const { token, user: loggedInUser } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);

      return { success: true, user: loggedInUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const errors = error.response?.data?.errors || [];
      const requiresVerification = error.response?.data?.requiresVerification;
      const email = error.response?.data?.email;
      
      // If email verification is required, store email for verification flow
      if (requiresVerification && email) {
        localStorage.setItem('pendingVerifyEmail', email);
        return { success: false, error: message, requiresVerification: true, errors };
      }
      
      return { success: false, error: message, errors };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // No global toast; pages can render their own UI if needed
  };

  // Update user data
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
