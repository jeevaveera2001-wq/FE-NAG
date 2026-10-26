import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nagulan_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('nagulan_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('nagulan_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Auth verify failed:', err);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      localStorage.setItem('nagulan_token', res.data.accessToken);
      localStorage.setItem('nagulan_refresh_token', res.data.refreshToken);
      localStorage.setItem('nagulan_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout notification error', err);
    }
    localStorage.removeItem('nagulan_token');
    localStorage.removeItem('nagulan_refresh_token');
    localStorage.removeItem('nagulan_user');
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isReception = user?.role === 'reception';
  const isStaff = user?.role === 'staff' || isReception || isAdmin;

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        isSuperAdmin,
        isAdmin,
        isReception,
        isStaff,
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
