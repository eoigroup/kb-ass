'use client'

// Updated: 2024-12-19 15:45:00 - Enhanced selected model indicators with prominent tick marks

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  name: string;
  type: string;
  provider: string;
  description?: string;
  capabilities?: string[];
}

interface AssistantConfig {
  name: string;
  model?: string;
  description?: string;
  instructions?: string;
}

interface AvailableModelsProps {
  showModels: boolean;
}

export default function AvailableModels({ showModels }: AvailableModelsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch both models and assistant config
      const [modelsResponse, configResponse] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/assistant-config')
      ]);
      
      const modelsData = await modelsResponse.json();
      const configData = await configResponse.json();
      
      console.log('Frontend received models data:', modelsData);
      console.log('Frontend received config data:', configData);
      
      if (modelsData.status === 'success') {
        setModels(modelsData.models);
      } else {
        setError(modelsData.message || 'Failed to fetch models');
      }
      
      if (configData.status === 'success') {
        setAssistantConfig(configData.config);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModels && isOpen && models.length === 0) {
      fetchModels();
    }
  }, [showModels, isOpen, models.length]);

  if (!showModels) return null;

  return (
    <div className="w-full mt-4 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          Available Chat Models ({models.length})
          {assistantConfig?.model && (
            <span className="ml-2 text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Current: {assistantConfig.model}
            </span>
          )}
        </span>
        <span className="text-xl text-gray-600 dark:text-gray-300">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading models...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No models available
            </div>
          ) : (
            <>
              {assistantConfig && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Current Assistant Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {assistantConfig.name}</p>
                    {assistantConfig.model && (
                      <p>
                        <span className="font-medium">Model:</span> 
                        <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                          ✓ {assistantConfig.model}
                        </span>
                      </p>
                    )}
                    {assistantConfig.description && (
                      <p><span className="font-medium">Description:</span> {assistantConfig.description}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => {
                  const isSelected = assistantConfig?.model === model.name || assistantConfig?.model === model.id;
                  return (
                    <div
                      key={model.id}
                      className={`p-4 rounded-lg border-2 ${
                        isSelected 
                          ? 'bg-green-50 dark:bg-green-900 border-green-400 dark:border-green-500 shadow-lg' 
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {isSelected && (
                            <span className="mr-2 text-green-600 dark:text-green-400 text-lg">
                              ✓
                            </span>
                          )}
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {model.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded font-medium">
                              SELECTED
                            </span>
                          )}
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {model.provider}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Type: {model.type}
                      </p>
                      
                      {model.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {model.description}
                        </p>
                      )}
                      
                      {model.capabilities && model.capabilities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Capabilities:</p>
                          <div className="flex flex-wrap gap-1">
                            {model.capabilities.map((capability, index) => (
                              <span
                                key={index}
                                className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                              >
                                {capability}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 