import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { normalizeUser } from '../utils/normalize';

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>('kanban-user', null);
  const [token, setToken] = useLocalStorage<string | null>('kanban-token', null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: AuthResponse = await response.json();
      setUser(normalizeUser(data.user));
      setToken(data.token);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data: AuthResponse = await response.json();
      setUser(normalizeUser(data.user));
      setToken(data.token);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // Verify token on app start
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(normalizeUser(data));
          return;
        }
        // If not ok fallthrough to clear auth
        setUser(null);
        setToken(null);
      } catch (error) {
        console.error('Token verification error:', error);
        setUser(null);
        setToken(null);
      }
    };

    verifyToken();
  }, [token]);

  return {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };
}