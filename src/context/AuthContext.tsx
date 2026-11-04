import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, admin: AdminUser) => void;
  logout: () => Promise<void>;
  hasRole: (...roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('revoo_admin_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/admin/profile');
        setAdmin(res.data.data);
      } catch (err) {
        localStorage.removeItem('revoo_admin_token');
        localStorage.removeItem('revoo_admin_refresh_token');
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, refreshToken: string, adminUser: AdminUser) => {
    localStorage.setItem('revoo_admin_token', token);
    localStorage.setItem('revoo_admin_refresh_token', refreshToken);
    setAdmin(adminUser);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/admin/logout');
    } catch (err) {
      // Continue cleanup regardless
    } finally {
      localStorage.removeItem('revoo_admin_token');
      localStorage.removeItem('revoo_admin_refresh_token');
      setAdmin(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (...roles: AdminRole[]) => {
    if (!admin) return false;
    if (admin.role === 'SUPER_ADMIN') return true;
    return roles.includes(admin.role);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
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

