import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from '../contexts/NotificationContext';

interface UseWebSocketProps {
  boardId?: string | null;
  onMessage?: (data: any) => void;
  messageTypes?: string[];
}

export function useWebSocket({ boardId, onMessage, messageTypes = [] }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socket = useRef<WebSocket | null>(null);
  const { token, user } = useAuth();
  const { increaseUnreadCount, playNotificationSound } = useNotifications();
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!token || (!boardId && messageTypes.indexOf('private_message') === -1)) {
      return;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = boardId 
      ? `${protocol}//${host}/api/ws/${boardId}` 
      : `${protocol}//${host}/api/ws/private`;
    
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
          if (msgData.sender_id !== parseInt(user?.id || '0')) {
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
        boardId: boardId ? parseInt(boardId) : undefined,
      };
      socket.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  return {
    isConnected,
    lastMessage,
    sendMessage
  };
} 