'use client';

// Updated: 2025-01-08 19:15:00 - Completely redesigned right panel with modern, polished UI

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { chat } from './actions';
import ReactMarkdown from 'react-markdown';
import { formatEvaluationMetrics, getEntailmentDisplay, EvaluationResponse } from './utils/evaluationUtils';
import Image from 'next/image';
import AssistantFiles from './components/AssistantFiles';
import AvailableModels from './components/AvailableModels';
import ModernRightPanel from './components/ModernRightPanel';
import SmartQueryHelper from './components/SmartQueryHelper';
import { File, Reference, Message } from './types';
import { v4 as uuidv4 } from 'uuid'; 

interface HomeProps {
  initialShowAssistantFiles: boolean;
  isAssistantAvailable: boolean;
}

export default function Home({ initialShowAssistantFiles, isAssistantAvailable }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'showcase' | 'files'>('showcase');
  const [showCitationsInChat, setShowCitationsInChat] = useState(false);
  const [currentResponseMeta, setCurrentResponseMeta] = useState<{
    model?: string;
    usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
    citations?: any[];
    scores?: any;
    contextData?: any;
    evaluationData?: EvaluationResponse;
    highlights?: any[];
    requestParams?: {
      temperature: number;
      filterOptions: any;
      contextOptions: any;
      includeHighlights: boolean;
    };
  }>({});
  const [enableEvaluation, setEnableEvaluation] = useState(false);
  const [groundTruthAnswer, setGroundTruthAnswer] = useState('');
  
  // Advanced Control States
  const [filterOptions, setFilterOptions] = useState({
    specialty: '',
    documentType: '',
    userRole: '',
    resource: ''
  });
  const [contextOptions, setContextOptions] = useState({
    snippetSize: 2048,
    topK: 16
  });
  const [temperature, setTemperature] = useState(0.3);
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [includeMessageHistory, setIncludeMessageHistory] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showDebugMode, setShowDebugMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const darkModePreference = localStorage.getItem('darkMode');
      if (darkModePreference === 'true' || 
          (!darkModePreference && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      
      // Check for debug mode in URL
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebugMode(urlParams.get('debug') === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/files');
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  const handleChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userInput = input.trim();
    setInput('');
    setIsStreaming(true);
    
    const newUserMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const { object } = await chat(
        includeMessageHistory ? messages.concat(newUserMessage) : [newUserMessage], 
        showCitationsInChat, 
        enableEvaluation, 
        groundTruthAnswer,
        filterOptions,
        contextOptions,
        temperature,
        includeHighlights,
        includeMessageHistory
      );
      let accumulatedContent = '';
      const newAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          const parsed = JSON.parse(partialObject);
          const { choices, metadata } = parsed;
          const content = choices?.[0]?.delta?.content;
          
          if (content) {
            accumulatedContent += content;
          }
          
          // Update metadata for showcase panel
          if (metadata) {
            setCurrentResponseMeta({
              model: metadata.model,
              usage: metadata.usage,
              citations: metadata.citations,
              scores: metadata.scores,
              contextData: metadata.contextData,
              evaluationData: metadata.evaluationData,
              highlights: metadata.highlights,
              requestParams: metadata.requestParams
            });
          }
          
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            lastMessage.content = accumulatedContent;
            return updatedMessages;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prevMessages => [...prevMessages, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isAssistantAvailable) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Assistant Unavailable</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">The AI assistant is currently not available. This might be due to configuration issues.</p>
            <div className="text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Please try:</p>
              <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                <li>Check your environment variables</li>
                <li>Restart the application</li>
                <li>Verify your configuration</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-1 bg-white dark:bg-gray-900">
        {/* Left Panel - Chat */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image 
                    src="/brain-logo.png" 
                    alt="LB Persona" 
                    width={32} 
                    height={32}
                    className="rounded-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">LB Assistant</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Healthcare Intelligence Platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to LB Assistant</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Your intelligent healthcare knowledge companion. Ask questions about medical conditions, treatments, market analysis, or research insights.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {[
                      { icon: "🏥", title: "Healthcare Insights", desc: "Medical conditions & treatments" },
                      { icon: "📊", title: "Market Analysis", desc: "Healthcare market trends" },
                      { icon: "🔬", title: "Research Data", desc: "Clinical studies & diagnostics" },
                      { icon: "💡", title: "Expert Knowledge", desc: "Professional medical guidance" }
                    ].map((item, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setInput(`Tell me about ${item.title.toLowerCase()}`)}>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-slide-${message.role === 'user' ? 'right' : 'left'}`}>
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-800'
                      }`}>
                        {message.role === 'user' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className={`${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      } rounded-xl px-4 py-3 shadow-sm`}>
                        {message.role === 'user' ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleChat} className="flex space-x-4">
              <div className="flex-1 relative">
                {/* Smart Query Helper */}
                <SmartQueryHelper 
                  onSuggestionClick={(suggestion) => setInput(suggestion)}
                  input={input}
                />
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about healthcare, diagnostics, markets, or medical research..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isStreaming}
                />
              </div>
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isStreaming ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Modern Right Panel */}
        <ModernRightPanel
          rightPanelView={rightPanelView}
          setRightPanelView={setRightPanelView}
          showCitationsInChat={showCitationsInChat}
          setShowCitationsInChat={setShowCitationsInChat}
          enableEvaluation={enableEvaluation}
          setEnableEvaluation={setEnableEvaluation}
          groundTruthAnswer={groundTruthAnswer}
          setGroundTruthAnswer={setGroundTruthAnswer}
          filterOptions={filterOptions}
          setFilterOptions={setFilterOptions}
          contextOptions={contextOptions}
          setContextOptions={setContextOptions}
          temperature={temperature}
          setTemperature={setTemperature}
          includeHighlights={includeHighlights}
          setIncludeHighlights={setIncludeHighlights}
          includeMessageHistory={includeMessageHistory}
          setIncludeMessageHistory={setIncludeMessageHistory}
          currentResponseMeta={currentResponseMeta}
          showDebugMode={showDebugMode}
          files={files}
        />
      </div>
    </div>
  );
}