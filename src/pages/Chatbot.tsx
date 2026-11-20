
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Bot, User, HelpCircle, Sparkles } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I can look up a few bundled soil and crop-care notes. What would you like to check?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      let data: { response?: string; error?: string; detail?: string | Array<{ msg?: string }> } | null = null;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse chat response JSON:', jsonError);
      }

      let botResponseText = "Sorry, I couldn't get a response at this time.";
      if (!response.ok) {
        const validationMessage = Array.isArray(data?.detail) ? data.detail[0]?.msg : data?.detail;
        botResponseText = data?.error || validationMessage || `The guide could not answer (${response.status}). Please try again.`;
      } else if (data?.response) {
        botResponseText = data.response;
      } else if (data?.error) {
        botResponseText = `Error: ${data.error}`;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error connecting to the chatbot server. Please ensure the backend is running.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Farming guide</h1>
          <p className="text-muted-foreground">
            Look up bundled reference notes. Confirm crop and treatment decisions with local agricultural guidance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="glass-panel h-full flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[60vh]">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-muted rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.sender === 'bot' ? (
                            <Bot className="h-4 w-4 mr-2" />
                          ) : (
                            <User className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.sender === 'bot' ? 'AgriWise guide' : 'You'} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-2" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs ml-2 opacity-70">Checking the reference…</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about soil, blight, or irrigation…"
                    maxLength={500}
                    aria-label="Question for the farming guide"
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="glass-panel mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                  Suggested Questions
                </h3>
                <div className="space-y-2">
                  {[
                    "What does the late blight reference say?",
                    "How should I plan a planting date for my area?",
                    "Why use a soil test before applying fertilizer?",
                    "What should I check before choosing a pesticide?",
                    "What should I check before irrigating?"
                  ].map((question, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => {
                    setInput(question);
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-panel">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
                  How It Works
                </h3>
                <div className="space-y-4 text-sm">
                  <p>
                    The guide looks up a small set of bundled notes about soil and common plant diseases. It does not use an AI model or field-specific data.
                  </p>
                  <p>
                    Use the notes as general information only. Confirm disease identification and treatment with a qualified local adviser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
