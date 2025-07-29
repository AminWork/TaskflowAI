import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from '../contexts/NotificationContext';

interface UseWebSocketProps {
  boardId?: string | null;
  onMessage?: (data: any) => void;
  messageTypes?: string[];
}

interface TypingNotificationData {
  senderId: number;
  recipientId: number;
  isTyping: boolean;
}

export function useWebSocket({ boardId, onMessage, messageTypes = [] }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const socket = useRef<WebSocket | null>(null);
  const { token, user } = useAuth();
  const { increaseUnreadCount, playNotificationSound } = useNotifications();
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!token || (!boardId && messageTypes.indexOf('private_message') === -1)) {
      return;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Determine the correct WebSocket host:
    // 1. Prefer explicit env override (VITE_WS_BASE), e.g. ws://localhost:3001
    // 2. If running Vite dev server on :5173, default to backend :3001
    // 3. Otherwise fall back to the current origin host (production)
    const envWsBase = import.meta.env.VITE_WS_BASE as string | undefined;
    const computedHost = envWsBase
      ? envWsBase.replace(/^wss?:\/\//, '') // strip protocol if present
      : window.location.hostname === 'localhost' && window.location.port === '5173'
        ? 'localhost:8080'
        : window.location.host;

    const wsBase = `${protocol}//${computedHost}`;
    const wsUrl = boardId
      ? `${wsBase}/api/ws/${boardId}`
      : `${wsBase}/api/ws/private`;
    
    const ws = new WebSocket(wsUrl);
    socket.current = ws;
    
    const handleOpen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send authentication message
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'auth',
          token
        }));
      }
    };
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        // Handle private message notifications
        if (data.type === 'private_message' && data.recipientId && data.data) {
          const msgData = data.data;
          
          // If not the sender of this message, show notification
          if (msgData.sender_id !== parseInt(user?.id ? user.id.toString() : '0')) {
            // Increase unread message count
            increaseUnreadCount(msgData.sender_id.toString());
            
            // Play notification sound
            playNotificationSound();
            
            // Browser notification if available
            if (Notification.permission === 'granted') {
              const senderName = msgData.sender?.name || 'Someone';
              new Notification('New Private Message', {
                body: `${senderName}: ${msgData.content}`,
                icon: msgData.sender?.avatar || '/favicon.ico'
              });
            }
          }
        }
        
        // Handle typing notifications
        if (data.type === 'typing' && data.data) {
          const typingData: TypingNotificationData = data.data;
          
          // Only process typing notifications for the current user as recipient
          if (typingData.recipientId === parseInt(user?.id ? user.id.toString() : '0')) {
            setTypingUsers(prev => ({
              ...prev,
              [typingData.senderId]: typingData.isTyping
            }));
            
            // Auto-reset typing status after 3 seconds
            if (typingData.isTyping) {
              setTimeout(() => {
                setTypingUsers(prev => ({
                  ...prev,
                  [typingData.senderId]: false
                }));
              }, 3000);
            }
          }
        }
        
        // Call the onMessage callback if provided and message type is wanted
        if (onMessage && (messageTypes.length === 0 || messageTypes.includes(data.type))) {
          onMessage(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    const handleError = (error: Event) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    const handleClose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);
    
    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('close', handleClose);
      ws.close();
    };
  }, [boardId, token, user?.id, messageTypes, onMessage, increaseUnreadCount, playNotificationSound]);
  
  // Send a message through the WebSocket
  const sendMessage = (type: string, data: any) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        boardId: boardId ? parseInt(boardId, 10) : undefined,
      };
      socket.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  // Send typing notification
  const sendTyping = async (recipientId: number, isTyping: boolean) => {
    try {
      const response = await fetch('/api/private-messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          is_typing: isTyping
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send typing notification:', error);
      return false;
    }
  };
  
  return {
    isConnected,
    lastMessage,
    typingUsers,
    sendMessage,
    sendTyping
  };
} 