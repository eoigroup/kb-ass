'use client'

import { useState } from 'react';

interface SmartQueryHelperProps {
  onSuggestionClick: (suggestion: string) => void;
  input: string;
}

export default function SmartQueryHelper({ onSuggestionClick, input }: SmartQueryHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestions = [
    {
      category: "💰 Cost Efficient Queries",
      items: [
        "What are the key market trends in private healthcare?",
        "Show me recent diagnostic market data",
        "What's the latest in digital health adoption?",
        "Healthcare staffing market overview"
      ]
    },
    {
      category: "🎯 Targeted Research",
      items: [
        "department:market-research healthcare trends 2024",
        "document_type:report private acute care",
        "priority:high digital transformation",
        "Healthcare market size analysis"
      ]
    },
    {
      category: "📊 Quick Insights",
      items: [
        "Compare care markets vs healthcare markets",
        "What are the top 3 healthcare challenges?",
        "Latest regulatory changes impacting healthcare",
        "Technology adoption in diagnostics"
      ]
    }
  ];

  return (
    <div className="relative">
      {/* Smart Helper Button - always visible with different states */}
      {(input.trim() || !input.trim()) && (
        <div className="absolute bottom-full left-0 right-0 mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full border rounded-xl p-3 hover:shadow-lg transition-all duration-300 text-left group ${
              input.trim() 
                ? 'bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-700' 
                : 'bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-800/50 dark:via-gray-700/50 dark:to-gray-800/50 border-gray-200 dark:border-gray-600 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  input.trim() 
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}>
                  <span className="text-white text-sm">💡</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {input.trim() ? 'Smart Query Helper' : 'Need help? Try Smart Suggestions'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {input.trim() ? 'Get cost-efficient suggestions' : 'Click for query examples and cost tips'}
                  </div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Suggestions Panel */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 right-0 mb-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3 text-2xl">🎯</span>
                Smart Query Suggestions
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {suggestions.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                    {category.category}
                  </h4>
                  <div className="grid gap-2">
                    {category.items.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onSuggestionClick(suggestion);
                          setIsExpanded(false);
                        }}
                        className="text-left p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-md group"
                      >
                        <div className="text-sm text-gray-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-100">
                          {suggestion}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 dark:text-green-400 text-lg">💡</span>
                <div>
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">Cost Optimization Tip</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Use specific keywords like &quot;department:&quot;, &quot;document_type:&quot;, or &quot;priority:&quot; to get more targeted results and reduce processing costs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}