import React, { createContext, useContext, useState, useEffect  } from 'react';
import type { AuthUser, LoginData, RegisterData } from '../types';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      const storedUser = authService.getUser();

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          // Token is invalid, clear storage
          authService.removeToken();
          authService.removeUser();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.login(data);

      authService.setToken(response.token);
      authService.setUser(response.user);
      setUser(response.user);

      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.register(data);

      authService.setToken(response.token);
      authService.setUser(response.user);
      setUser(response.user);

      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.removeToken();
      authService.removeUser();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
