'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function DemoChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. I can help you find HVAC products, answer questions, and provide recommendations. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const predefinedResponses = {
    'air conditioner': 'I can help you find the perfect air conditioner! We have 1-ton, 1.5-ton, and 2-ton units with 3-star and 5-star energy ratings. What room size are you looking to cool?',
    'ventilation': 'Our ventilation systems include exhaust fans, ceiling fans, and industrial ventilation units. What type of ventilation are you looking for?',
    'price': 'Our air conditioners range from ₹25,000 to ₹65,000 depending on capacity and energy rating. Would you like to see specific models?',
    'installation': 'We provide free installation for all air conditioners within the city. Our certified technicians will install your unit within 24-48 hours of delivery.',
    'warranty': 'All our products come with manufacturer warranty. Air conditioners have 1-year comprehensive and 5-year compressor warranty.',
    'help': 'I can assist you with:\n• Product recommendations\n• Price information\n• Installation details\n• Warranty information\n• Technical specifications\n\nWhat would you like to know?'
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (message.includes(key)) {
        return response;
      }
    }
    
    // Default responses for common patterns
    if (message.includes('hello') || message.includes('hi')) {
      return 'Hello! Welcome to Air5Star. How can I help you find the perfect HVAC solution today?';
    }
    
    if (message.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    
    return 'I understand you\'re asking about "' + userMessage + '". Let me connect you with our product catalog. You can also browse our air conditioners and ventilation systems on the website. Is there something specific you\'d like to know?';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-[#111184] hover:bg-[#0d0d6b] shadow-lg transition-all duration-200 hover:scale-105"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 md:w-96 md:bottom-24 md:right-6">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-[#111184] text-white p-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Air5Star Assistant
                <span className="ml-auto text-xs bg-green-500 px-2 py-1 rounded-full">
                  Online
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div 
                id="chat-messages"
                className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-[#111184] text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none shadow-sm border'
                      }`}
                    >
                      <div className="whitespace-pre-line">{message.text}</div>
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none shadow-sm border p-3 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="icon"
                    className="bg-[#111184] hover:bg-[#0d0d6b]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  💡 Try asking about: air conditioners, prices, installation, warranty
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}