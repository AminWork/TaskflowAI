import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Copy, Reply, Download, File, Image, Video, Music } from 'lucide-react';
import { ChatMessage, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUser: User;
  onDelete: (messageId: string) => void;
  isOnline: boolean;
}

export function MessageBubble({ message, currentUser, onDelete, isOnline }: MessageBubbleProps) {
  const { t, isRTL } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const isOwnMessage = message.userId === currentUser.id;
  const isAI = message.sender === 'ai';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleDeleteMessage = () => {
    onDelete(message.id);
    setShowMenu(false);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={16} />;
    if (fileType.startsWith('video/')) return <Video size={16} />;
    if (fileType.startsWith('audio/')) return <Music size={16} />;
    return <File size={16} />;
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const handleFileDownload = () => {
    if (message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start space-x-3 rtl:space-x-reverse mb-4 group ${
        isOwnMessage 
          ? 'flex-row-reverse rtl:flex-row justify-start' 
          : 'justify-start'
      }`}
    >
      {/* Avatar - Always show, positioned based on sender */}
      <div className="flex-shrink-0">
        <img
          src={
            isAI
              ? `https://images.unsplash.com/photo-1496065187959-7f07b8353c55?w=40&h=40&fit=crop`
              : isOwnMessage
              ? currentUser.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`
              : message.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face`
          }
          alt={isOwnMessage ? currentUser.name : message.userName}
          className={`w-10 h-10 rounded-full border-2 shadow-md ${
            isOwnMessage 
              ? 'border-blue-200 dark:border-blue-700' 
              : isAI 
              ? 'border-purple-200 dark:border-purple-700'
              : 'border-gray-200 dark:border-gray-600'
          }`}
        />
        
        {/* Online status indicator */}
        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 -mt-3 ${
          isOwnMessage ? '-ml-1' : 'ml-7'
        } ${
          isAI 
            ? 'bg-purple-500'
            : isOnline 
            ? 'bg-green-500'
            : 'bg-gray-400'
        }`}></div>
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-sm ${isOwnMessage ? 'text-right rtl:text-left' : 'text-left rtl:text-right'}`}>
        {/* Message bubble */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`px-4 py-3 rounded-2xl shadow-md relative max-w-full inline-block ${
              isOwnMessage
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md'
                : isAI
                ? 'bg-gradient-to-r from-purple-100 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-700 rounded-bl-md'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-md'
            }`}
          >
            {/* Sender name, role, and time */}
            <div className={`flex items-center mb-2 ${
              isOwnMessage 
                ? 'justify-end flex-row-reverse rtl:flex-row' 
                : 'justify-start'
            } ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              <div className={`flex items-center space-x-1 rtl:space-x-reverse ${
                isOwnMessage ? 'flex-row-reverse rtl:flex-row' : ''
              }`}>
                <span className={`text-sm font-semibold ${
                  isOwnMessage 
                    ? 'text-white' 
                    : isAI 
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {isOwnMessage ? t('chat.you') : message.userName}
                </span>
                
                {isAI && (
                  <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium shadow-sm">
                    🤖 AI
                  </span>
                )}
              </div>
            </div>

            {/* Message content */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {/* File attachment */}
            {message.fileUrl && (
              <div className="mt-3">
                {isImageFile(message.fileType || '') ? (
                  <div className="rounded-lg overflow-hidden max-w-xs">
                    <img
                      src={message.fileUrl}
                      alt={message.fileName}
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(message.fileUrl, '_blank')}
                    />
                    {message.fileName && (
                      <div className="p-2 bg-black bg-opacity-50 text-white text-xs">
                        {message.fileName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors ${
                    isOwnMessage 
                      ? 'bg-white bg-opacity-20 border-white border-opacity-30' 
                      : 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                  }`}
                    onClick={handleFileDownload}
                  >
                    <div className={`p-2 rounded ${
                      isOwnMessage 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {getFileIcon(message.fileType || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.fileName}
                      </p>
                      <p className="text-xs opacity-75">
                        {message.fileSize ? formatFileSize(message.fileSize) : ''}
                      </p>
                    </div>
                    <Download size={16} className="opacity-75" />
                  </div>
                )}
              </div>
            )}

            {/* Time */}
            <div className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'} ${isOwnMessage ? 'text-left rtl:text-right' : 'text-right rtl:text-left'}`}>
              {formatTime(message.createdAt)}
            </div>

            {/* Message menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 ${isOwnMessage ? 'left-1' : 'right-1'} p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
                isOwnMessage ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <MoreVertical size={14} />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute top-8 ${isOwnMessage ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]`}
              >
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center space-x-2 rtl:space-x-reverse w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy size={14} />
                  <span>{t('chat.copyMessage')}</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 rtl:space-x-reverse w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Reply size={14} />
                  <span>{t('chat.reply')}</span>
                </button>

                {(isOwnMessage || currentUser.id === message.userId) && (
                  <button
                    onClick={handleDeleteMessage}
                    className="flex items-center space-x-2 rtl:space-x-reverse w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>{t('common.delete')}</span>
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 