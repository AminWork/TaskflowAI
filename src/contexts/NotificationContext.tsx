import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  unreadMessages: number;
  unreadConversations: Map<string, number>;
  lastMessageTimestamp: number;
  increaseUnreadCount: (userId: string) => void;
  resetUnreadCount: (userId?: string) => void;
  playNotificationSound: () => void;
  requestNotificationPermission: () => void;
  hasNotificationPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<Map<string, number>>(new Map());
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(Date.now());
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);
  const { token, isAuthenticated } = useAuth();
  
  // Initialize notification sound
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    setNotificationSound(audio);
    
    // Check notification permission on mount
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasNotificationPermission(true);
      }
    }
  }, []);
  
  // Load unread counts from API when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUnreadCounts();
    }
  }, [isAuthenticated, token]);
  
  const fetchUnreadCounts = async () => {
    try {
      const tokenStr = token;
      const response = await fetch('/api/private-messages/unread-counts', {
        headers: { 'Authorization': `Bearer ${tokenStr}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        let totalUnread = 0;
        const conversationCounts = new Map<string, number>();
        
        // Process the unread counts from the response
        if (data.conversations) {
          data.conversations.forEach((conv: any) => {
            conversationCounts.set(conv.userId, conv.unreadCount);
            totalUnread += conv.unreadCount;
          });
        }
        
        setUnreadMessages(totalUnread);
        setUnreadConversations(conversationCounts);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };
  
  const increaseUnreadCount = (userId: string) => {
    // Update the timestamp of last received message
    setLastMessageTimestamp(Date.now());
    
    // Update unread counts
    setUnreadMessages(prev => prev + 1);
    
    setUnreadConversations(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(userId) || 0;
      newMap.set(userId, currentCount + 1);
      return newMap;
    });
  };
  
  const resetUnreadCount = (userId?: string) => {
    if (userId) {
      // Reset count for specific conversation
      setUnreadConversations(prev => {
        const newMap = new Map(prev);
        const currentCount = newMap.get(userId) || 0;
        
        if (currentCount > 0) {
          setUnreadMessages(prev => prev - currentCount);
          newMap.set(userId, 0);
        }
        
        return newMap;
      });
    } else {
      // Reset all counts
      setUnreadMessages(0);
      setUnreadConversations(new Map());
    }
  };
  
  const playNotificationSound = () => {
    if (notificationSound) {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(err => {
        console.error('Failed to play notification sound:', err);
      });
    }
  };
  
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setHasNotificationPermission(true);
        }
      });
    }
  };
  
  const contextValue: NotificationContextType = {
    unreadMessages,
    unreadConversations,
    lastMessageTimestamp,
    increaseUnreadCount,
    resetUnreadCount,
    playNotificationSound,
    requestNotificationPermission,
    hasNotificationPermission,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 