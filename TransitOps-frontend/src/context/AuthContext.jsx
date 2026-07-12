import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

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
      const parsedUser = JSON.parse(savedUser);

      // Migrate stale 'driver' role to 'dispatcher' after the role rename
      if (parsedUser.role === 'driver') {
        parsedUser.role = 'dispatcher';
        localStorage.setItem('transitops_user', JSON.stringify(parsedUser));
      }

      setToken(savedToken);
      setUser(parsedUser);
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

        if (email.includes('dispatcher') || email.includes('driver')) {
          role = 'dispatcher';
          name = 'John Doe (Dispatcher)';
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
        const res = await apiClient.post('auth/login/', { email, password });
        if (res.success && res.data) {
          const { access, refresh, user: userData } = res.data;
          
          localStorage.setItem('transitops_token', access);
          localStorage.setItem('transitops_refresh_token', refresh);
          localStorage.setItem('transitops_user', JSON.stringify(userData));
          
          setToken(access);
          setUser(userData);
          setIsLoading(false);
          return { success: true };
        } else {
          throw new Error(res.message || 'Login failed');
        }
      }
    } catch (error) {
      setIsLoading(false);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
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
