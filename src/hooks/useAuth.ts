import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>('kanban-user', null);
  const [token, setToken] = useLocalStorage<string | null>('kanban-token', null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user profile if token exists
  useEffect(() => {
    if (token && !user) {
      fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setUser(data))
        .catch(() => {
          setUser(null);
          setToken(null);
        });
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    token,
  };
}