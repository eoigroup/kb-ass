'use client';

// Updated: 2025-01-08 22:45:00 - Restored tabbed interface with enhanced file management

import { useState } from 'react';
import AssistantFiles from './AssistantFiles';
import FileUploadWithMetadata from './FileUploadWithMetadata';
import BatchFileProcessor from './BatchFileProcessor';
import { File } from '../types';

interface FileManagementTabsProps {
  files: File[];
  referencedFiles: File[];
  onFilesChange: () => void; // Callback to refresh files, e.g., reload page
}

export default function FileManagementTabs({ files, referencedFiles, onFilesChange }: FileManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'upload' | 'batch'>('view');

  return (
    <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Corporate Tab Header */}
      <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold transition-colors ${
            activeTab === 'view'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('view')}
        >
          📁 View ({files.length})
        </button>
        <button
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold transition-colors ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload
        </button>
        <button
          className={`flex-1 py-2 px-3 text-center text-xs font-semibold transition-colors ${
            activeTab === 'batch'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('batch')}
        >
          📦 Batch
        </button>
      </div>

      {/* Corporate Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'view' && (
          <div className="p-3">
            <AssistantFiles files={files} referencedFiles={referencedFiles} />
          </div>
        )}
        {activeTab === 'upload' && (
          <div className="p-3">
            <FileUploadWithMetadata onUploadSuccess={onFilesChange} />
          </div>
        )}
        {activeTab === 'batch' && (
          <div className="p-3">
            <BatchFileProcessor onBatchComplete={onFilesChange} />
          </div>
        )}
      </div>
    </div>
  );
}