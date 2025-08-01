'use client';

// Updated: 2025-01-08 18:15:00 - Added debug mode URL parameter to conditionally show model information

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { chat } from './actions';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import AssistantFiles from './components/AssistantFiles';
import AvailableModels from './components/AvailableModels';
import { File, Reference, Message } from './types';
import { v4 as uuidv4 } from 'uuid'; 

interface HomeProps {
  initialShowAssistantFiles: boolean;
  showCitations: boolean;
  showModels: boolean;
}

export default function Home({ initialShowAssistantFiles, showCitations, showModels }: HomeProps) {
  const [loading, setLoading] = useState(true);
  const [assistantExists, setAssistantExists] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [referencedFiles, setReferencedFiles] = useState<Reference[]>([]);
  const [showAssistantFiles, setShowAssistantFiles] = useState(initialShowAssistantFiles);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'showcase' | 'files'>('showcase');
  const [showCitationsInChat, setShowCitationsInChat] = useState(false);
  const [currentResponseMeta, setCurrentResponseMeta] = useState<{
    model?: string;
    usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
    citations?: any[];
  }>({});
  const [showDebugMode, setShowDebugMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const isDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
      
      // Check for debug mode in URL
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebugMode(urlParams.get('debug') === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', (!darkMode).toString());
      document.documentElement.classList.toggle('dark');
    }
  };

  const extractReferences = (content: string): Reference[] => {
    const references: Reference[] = [];
    
    // Extract full file names from the content
    const fileNameRegex = /([^:\n]+\.[a-zA-Z0-9]+)/g;
    const fileMatches = content.match(fileNameRegex);
    
    if (fileMatches) {
      fileMatches.forEach(fileName => {
        references.push({ name: fileName.trim() });
      });
    }

    return references;
  };

  useEffect(() => {
    checkAssistant();
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      console.log('Frontend received files data:', data);
      console.log('Number of files received:', data.files ? data.files.length : 'No files');
      if (data.status === 'success') {
        setFiles(data.files);
      } else {
        console.error('Error fetching files:', data.message);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const checkAssistant = async () => {
    try {
      const response = await fetch('/api/assistants')
      const data = await response.json()
      
      setLoading(false)
      setAssistantExists(data.exists)
      setAssistantName(data.assistant_name)
      if (!data.exists) {
        setError('Please create an Assistant')
      }
    } catch (error) {
      setLoading(false)
      setError('Error connecting to the Assistant')
      
    }
  }

  const handleChat = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = {
      id: uuidv4(), // Generate a unique ID
      role: 'user',
      content: input,
      timestamp: new Date().toISOString() 
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const { object } = await chat([newUserMessage], showCitationsInChat);
      let accumulatedContent = '';
      const newAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        references: []
      };
      
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

      // Process the response stream from the Assistant that is created in the ./actions.ts Server action
      for await (const chunk of readStreamableValue(object)) {
        try {
          const data = JSON.parse(chunk);
          const content = data.choices[0]?.delta?.content;
          const metadata = data.metadata;
          
          if (content) {
            accumulatedContent += content;
          }
          
          // Update metadata for showcase panel
          if (metadata) {
            setCurrentResponseMeta({
              model: metadata.model,
              usage: metadata.usage,
              citations: metadata.citations
            });
          }
          
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            lastMessage.content = accumulatedContent;
            return updatedMessages;
          });

        } catch (error) {
          console.error('Error parsing chunk:', error);
        }
      }

      // Extract references after the full message is received
      const extractedReferences = extractReferences(accumulatedContent);
      setReferencedFiles(extractedReferences);

    } catch (error) {
      console.error('Error in chat:', error);
      setError('An error occurred while chatting.');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src=""
                  alt="LB"
                  width={20}
                  height={20}
                  className="opacity-60"
                />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Connecting to your Assistant...</p>
          </div>
        </div>
      ) : assistantExists ? (
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/brain-logo.png"
                alt="LB Assistant"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  LB Persona 
               
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  {assistantName} <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </p>
              </div>
            </div>
      <button
        onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
          </header>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Section - Left Side */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start a conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Ask me anything about healthcare markets, diagnostics, or any topic from the knowledge base.</p>
        </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                        {message.role === 'user' ? (
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">U</span>
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Image
                              src="/brain-logo.png"
                                alt="Assistant"
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            </div>
                        )}
                      </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}>
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                                <a {...props} className={`underline ${
                                  message.role === 'user' 
                                    ? 'text-indigo-200 hover:text-white' 
                                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
                                }`}>
                                  {props.children}
                              </a>
                            ),
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                              h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-md font-semibold mb-1">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              code: ({ children }) => (
                                <code className={`px-1 py-0.5 rounded text-sm ${
                                  message.role === 'user' 
                                    ? 'bg-indigo-700 text-indigo-100' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {children}
                                </code>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        </div>
                      </div>
                          </div>
                  ))
                )}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[85%]">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Image
                            src="/brain-logo.png"
                            alt="Assistant"
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 mb-4 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Ask me anything about healthcare..."
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isStreaming || !input.trim()}
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

            {/* Right Panel - Files/Showcase Toggle */}
            <div className="w-96 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Panel Header with Toggle */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setRightPanelView('showcase')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        rightPanelView === 'showcase'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Showcase
                    </button>
                    <button
                      onClick={() => setRightPanelView('files')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        rightPanelView === 'files'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Files
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Citations in chat:</span>
                    <button
                      onClick={() => setShowCitationsInChat(!showCitationsInChat)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        showCitationsInChat
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {showCitationsInChat ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rightPanelView === 'files' ? 'Knowledge Base' : 'Response Showcase'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {rightPanelView === 'files' 
                    ? `${files.length} documents available` 
                    : 'Real-time response metadata'
                  }
                </p>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {rightPanelView === 'files' ? (
                  /* Files View */
                  <div className="space-y-3">
                    {files.map((file, index) => {
                      const isReferenced = referencedFiles.some(ref => 
                        file.name.toLowerCase().includes(ref.name.toLowerCase()) ||
                        ref.name.toLowerCase().includes(file.name.toLowerCase())
                      );
                      
                      return (
                        <div
                          key={file.id}
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                            isReferenced
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium text-sm truncate ${
                                isReferenced 
                                  ? 'text-indigo-900 dark:text-indigo-100' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {file.name}
                              </h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(file.size / 1024 / 1024 * 10) / 10} MB
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(file.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {isReferenced && (
                              <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
                                Referenced
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                              <div className="bg-green-500 h-1 rounded-full w-full"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                                ) : (
                  /* Showcase View */
                  <div className="space-y-6">
                    {/* Model Information - Only show in debug mode */}
                    {showDebugMode && (
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Model
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentResponseMeta.model || 'No model data yet'}
                        </p>
                      </div>
                    )}

                    {/* Token Usage */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Token Usage
                      </h3>
                      {currentResponseMeta.usage ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{currentResponseMeta.usage.total_tokens}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Prompt:</span>
                            <span className="text-gray-900 dark:text-white">{currentResponseMeta.usage.prompt_tokens}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                            <span className="text-gray-900 dark:text-white">{currentResponseMeta.usage.completion_tokens}</span>
                          </div>
                          <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(currentResponseMeta.usage.completion_tokens / currentResponseMeta.usage.total_tokens) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No usage data yet</p>
                      )}
                    </div>

                    {/* Citations */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Citations ({currentResponseMeta.citations?.length || 0})
                      </h3>
                      {currentResponseMeta.citations && currentResponseMeta.citations.length > 0 ? (
                        <div className="space-y-2">
                          {currentResponseMeta.citations.map((citation, index) => (
                            <div key={index} className="text-sm">
                              {citation.references?.map((ref: any, refIndex: number) => (
                                <div key={refIndex} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">{ref.file.name}</p>
                                  <p className="text-gray-600 dark:text-gray-400 mb-2">Pages: {ref.pages?.join(', ') || 'N/A'}</p>
                                  {ref.file.signed_url && (
                                    <a 
                                      href={ref.file.signed_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      View Document
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No citations yet</p>
                      )}
                    </div>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Assistant Unavailable</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <div className="text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-2">To resolve this:</p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Check your environment variables</li>
                  <li>Restart the application</li>
                  <li>Verify your configuration</li>
            </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}