import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Paperclip } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PrivateMessage, User } from '../../types';
import { normalizePrivateMessage } from '../../utils/normalize';

interface PrivateMessageWindowProps {
  recipient: User;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateMessageWindow({ recipient, currentUser, isOpen, onClose }: PrivateMessageWindowProps) {
  const { t } = useLanguage();
  const { resetUnreadCount } = useNotifications();
  const { sendMessage: sendWebSocketMessage, sendTyping, typingUsers } = useWebSocket({ messageTypes: ['private_message', 'typing'] });
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when component opens
  useEffect(() => {
    if (isOpen && recipient) {
      loadMessages();
      markAsRead();
      resetUnreadCount(String(recipient.id)); // Reset unread count for this conversation
    }
  }, [isOpen, recipient]);

  const loadMessages = async () => {
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
      const response = await fetch(`/api/private-messages/users/${String(recipient.id)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedMessages = (data.messages || []).map(normalizePrivateMessage);
        setMessages(normalizedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async () => {
    try {
      const tokenStr = localStorage.getItem('kanban-token');
      const token = tokenStr ? JSON.parse(tokenStr) : null;
            await fetch(`/api/private-messages/users/${recipient.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Send message through WebSocket
    const success = sendWebSocketMessage('private_message', {
      recipient_id: recipient.id,
      content: newMessage.trim(),
    });

    if (success) {
      // Create a temporary message for immediate UI update
      const tempMessage: PrivateMessage = {
        id: Date.now().toString(), // Temporary ID as string
        senderId: currentUser.id,
        recipientId: recipient.id,
        content: newMessage.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: currentUser,
        recipient: recipient
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      inputRef.current?.focus();
      
      // Send typing indicator that we've stopped typing
      sendTyping(recipient.id, false);
    } else {
      // Fallback to REST API if WebSocket fails
      try {
        const tokenStr = localStorage.getItem('kanban-token');
        const token = tokenStr ? JSON.parse(tokenStr) : null;
        
        const response = await fetch('/api/private-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipient_id: recipient.id,
            content: newMessage.trim(),
          }),
        });

        if (response.ok) {
          const rawMessage = await response.json();
          const normalizedMessage = normalizePrivateMessage(rawMessage);
          // Replace the temporary message with the real one
          setMessages(prev => [...prev.slice(0, -1), normalizedMessage]);
          setNewMessage('');
          inputRef.current?.focus();
        } else {
          const errorData = await response.json();
          console.error('Failed to send message:', errorData);
          alert(t('chat.sendError'));
          // Remove the temporary message if sending failed
          setMessages(prev => prev.slice(0, -1));
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        alert(t('chat.sendError'));
        // Remove the temporary message if sending failed
        setMessages(prev => prev.slice(0, -1));
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Send typing indicator to recipient
    sendTyping(recipient.id, true);
    
    // Clear existing timeout
    if (typingTimeout) {
      window.clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const newTimeout = window.setTimeout(() => {
      sendTyping(recipient.id, false);
    }, 1500);
    
    setTypingTimeout(newTimeout);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl h-[700px] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-100"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={recipient.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face`}
                alt={recipient.name}
                className="w-12 h-12 rounded-full border-3 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">{recipient.name}</h3>
              <p className="text-white/70 text-sm">{recipient.email}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Send className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-center text-lg font-medium text-gray-600">Start your conversation</p>
              <p className="text-sm text-center mt-2 text-gray-400">Send your first message to {recipient.name}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUser.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                    isOwn 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                      : 'bg-white text-gray-900 border border-gray-100'
                  }`}
                  style={{
                    borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
                  }}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      isOwn ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          
          {/* Typing indicator */}
          {typingUsers[recipient.id] && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100" style={{ borderRadius: '20px 20px 20px 4px' }}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div 
          className="p-6 border-t border-gray-100"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${recipient.name}...`}
                className="w-full px-6 py-4 pr-14 border-0 bg-gray-50 text-gray-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                }}
                disabled={false}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  title="Add attachment"
                >
                  <Paperclip size={18} />
                </motion.button>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              style={{
                background: !newMessage.trim() 
                  ? '#d1d5db' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
              }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 