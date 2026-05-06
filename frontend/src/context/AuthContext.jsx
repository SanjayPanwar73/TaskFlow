import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleUnauthorized = () => {
      if (!isMounted) {
        return;
      }

      setUser(null);
      setLoading(false);
    };

    const bootstrapSession = async () => {
      try {
        const { data } = await api.get('/auth/me');

        if (!isMounted) {
          return;
        }

        setUser(data.user);
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    bootstrapSession();

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout transport errors and clear local state regardless.
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  };

  const isAdmin = user?.role === 'Admin';
  const isMember = user?.role === 'Member';

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, isAdmin, isMember }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
};
