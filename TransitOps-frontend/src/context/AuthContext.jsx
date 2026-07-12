import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user details and token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('transitops_token');
    const savedUser = localStorage.getItem('transitops_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password, useMock = true) => {
    setIsLoading(true);
    try {
      if (useMock) {
        // Mock authentication logic
        let role = 'fleet_manager'; // Default role
        let name = 'Om Solanki';

        if (email.includes('driver')) {
          role = 'driver';
          name = 'John Doe (Driver)';
        } else if (email.includes('safety')) {
          role = 'safety_officer';
          name = 'Jane Smith (Safety)';
        } else if (email.includes('finance')) {
          role = 'financial_analyst';
          name = 'Bob Johnson (Finance)';
        }

        const mockUser = {
          id: 1,
          name,
          email,
          role,
        };

        const mockToken = 'mock_jwt_access_token_xyz_12345';
        
        localStorage.setItem('transitops_token', mockToken);
        localStorage.setItem('transitops_user', JSON.stringify(mockUser));
        
        setToken(mockToken);
        setUser(mockUser);
        setIsLoading(false);
        return { success: true };
      } else {
        const payload = { email, password };
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/'}auth/login/`,
          payload
        );
        const loginData = response.data;
        if (loginData.success) {
          const { access, refresh, user: apiUser } = loginData.data;
          
          localStorage.setItem('transitops_token', access);
          localStorage.setItem('transitops_refresh_token', refresh);
          localStorage.setItem('transitops_user', JSON.stringify(apiUser));
          
          setToken(access);
          setUser(apiUser);
          setIsLoading(false);
          return { success: true };
        } else {
          throw new Error(loginData.error?.message || 'Login failed');
        }
      }
    } catch (error) {
      setIsLoading(false);
      // If error is from axios, format it
      const errorMsg = error.response?.data?.error?.message || error.message || 'Login failed';
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_refresh_token');
    localStorage.removeItem('transitops_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
