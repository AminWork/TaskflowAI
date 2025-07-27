import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Task } from '../types';
import { MessageCircle, Mic, MicOff, Send, Bot, User, Volume2, Brain } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { generateAIResponse } from '../utils/aiResponses';
import { speakText } from '../utils/textToSpeech';
import { useLanguage } from '../contexts/LanguageContext';

interface AIAssistantProps {
  tasks: Task[];
  onTaskCreated: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AIAssistant({ tasks, onTaskCreated }: AIAssistantProps) {
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      boardId: '1',
      userId: 'ai',
      content: "Hi! I'm your AI assistant. I can help you manage your tasks, provide productivity tips, and you can even use voice commands to create new tasks. Try saying 'Create a task to...' or ask me about your progress!",
      sender: 'ai',
      userName: 'AI Assistant',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      boardId: '1',
      userId: 'user',
      content: inputMessage,
      sender: 'user',
      userName: 'User',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Check if the message is a task creation command
    const lowerMessage = inputMessage.toLowerCase();
    if (lowerMessage.includes('create a task') || lowerMessage.includes('add a task') || lowerMessage.includes('new task')) {
      const taskMatch = inputMessage.match(/(?:create|add|new)\s+(?:a\s+)?task\s+(?:to\s+)?(.+?)(?:\s+with\s+(low|medium|high)\s+priority)?$/i);
      
      if (taskMatch) {
        const taskTitle = taskMatch[1].trim();
        const priority = (taskMatch[2] as Task['priority']) || 'medium';
        
        const newTask = {
          title: taskTitle,
          description: `Created via AI voice command`,
          priority,
          category: 'AI Created',
          status: 'todo' as const,
          tags: ['voice-created'],
        };
        
        onTaskCreated(newTask);
        
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          boardId: '1',
          userId: 'ai',
          content: `Perfect! I've created a new task: "${taskTitle}" with ${priority} priority. You can find it in your To Do column.`,
          sender: 'ai',
          userName: 'AI Assistant',
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, aiResponse]);
        speakText(aiResponse.content);
      }
    } else {
      // Generate AI response
      const aiResponseText = generateAIResponse(inputMessage, tasks);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        boardId: '1',
        userId: 'ai',
        content: aiResponseText,
        sender: 'ai',
        userName: 'AI Assistant',
        createdAt: new Date().toISOString(),
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, aiResponse]);
        speakText(aiResponseText);
      }, 500);
    }

    setInputMessage('');
    resetTranscript();
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <>
      {/* AI Assistant Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 ${isRTL ? 'left-6' : 'right-6'} bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-40`}
      >
        <Brain size={24} />
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className={`fixed bottom-44 ${isRTL ? 'left-6' : 'right-6'} w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50`}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <h3 className="font-semibold">AI Assistant</h3>
              <div className="flex items-center space-x-1 ml-auto">
                {speechSupported && (
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'ai' && <Bot size={16} className="mt-1 text-blue-600" />}
                    {message.sender === 'user' && <User size={16} className="mt-1" />}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.sender === 'ai' && (
                      <button
                        onClick={() => speakText(message.content)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything or use voice commands..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
            {isListening && (
              <div className="mt-2 text-center">
                <span className="text-sm text-red-600 animate-pulse">🎤 Listening...</span>
              </div>
            )}
            {speechError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-600">{speechError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}