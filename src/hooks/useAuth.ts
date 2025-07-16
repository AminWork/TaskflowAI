import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>('kanban-user', null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation for demo
    if (email && password.length >= 6) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
        createdAt: new Date(),
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password.length >= 6 && name) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
        createdAt: new Date(),
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}