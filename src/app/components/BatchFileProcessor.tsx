'use client';

// Updated: 2025-01-08 22:45:00 - Batch file upload with shared metadata options

import { useState, useCallback } from 'react';

interface BatchFileProcessorProps {
  onBatchComplete: () => void;
}

export default function BatchFileProcessor({ onBatchComplete }: BatchFileProcessorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [sharedMetadata, setSharedMetadata] = useState({
    department: '',
    document_type: '',
    priority: '',
    date_range: '',
    category: '',
    tags: '',
    project: '',
    version: ''
  });

  const departmentOptions = [
    { value: '', label: '🏢 Select Department' },
    { value: 'engineering', label: '🔧 Engineering' },
    { value: 'marketing', label: '📢 Marketing' },
    { value: 'sales', label: '💼 Sales' },
    { value: 'finance', label: '💰 Finance' },
    { value: 'hr', label: '👥 HR' },
    { value: 'legal', label: '⚖️ Legal' },
    { value: 'operations', label: '⚙️ Operations' },
  ];

  const documentTypeOptions = [
    { value: '', label: '📋 Select Document Type' },
    { value: 'manual', label: '📖 Manual' },
    { value: 'report', label: '📊 Report' },
    { value: 'policy', label: '📋 Policy' },
    { value: 'contract', label: '📜 Contract' },
    { value: 'guide', label: '🗺️ Guide' },
    { value: 'analysis', label: '📈 Analysis' },
    { value: 'specification', label: '📐 Specification' },
  ];

  const priorityOptions = [
    { value: '', label: '⭐ Select Priority' },
    { value: 'high', label: '🔴 High Priority' },
    { value: 'medium', label: '🟡 Medium Priority' },
    { value: 'low', label: '🟢 Low Priority' },
  ];

  const dateRangeOptions = [
    { value: '', label: '📅 Select Time Period' },
    { value: 'recent', label: '🆕 Recent (2024-2025)' },
    { value: 'archive', label: '📚 Archive (Before 2024)' },
  ];

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleMetadataChange = (key: string, value: string) => {
    setSharedMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        const formData = new FormData();
        formData.append('file', file);
        
        // Clean shared metadata
        const cleanMetadata = Object.entries(sharedMetadata).reduce((acc, [key, value]) => {
          if (value.trim()) {
            if (key === 'tags') {
              acc[key] = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
              acc[key] = value.trim();
            }
          }
          return acc;
        }, {} as any);

        formData.append('metadata', JSON.stringify(cleanMetadata));

        try {
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: result.status === 'success' ? 100 : -1
          }));

          results.push({
            file: file.name,
            success: result.status === 'success',
            message: result.message
          });

        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: -1
          }));
          
          results.push({
            file: file.name,
            success: false,
            message: 'Upload failed'
          });
        }
      }

      // Show results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        alert(`✅ All ${successful} files uploaded successfully!`);
      } else {
        alert(`📊 Upload completed: ${successful} successful, ${failed} failed`);
      }

      if (successful > 0) {
        onBatchComplete();
        setFiles([]);
        setSharedMetadata({
          department: '',
          document_type: '',
          priority: '',
          date_range: '',
          category: '',
          tags: '',
          project: '',
          version: ''
        });
      }

    } catch (error) {
      console.error('Batch upload error:', error);
      alert('Batch upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const estimatedCost = files.length * 0.002; // Rough estimate

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.4a1 1 0 00-.707-.293H7a2 2 0 00-2 2v11a2 2 0 002 2z" />
          </svg>
          Batch Upload
        </h3>
        <p className="text-xs text-orange-700 dark:text-orange-300 mb-3 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-700">
          ⚠️ <strong>Important:</strong> Metadata can only be set during upload and cannot be modified afterward due to the way the files are stored in the database.
        </p>

        {/* Compact Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 text-center mb-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Drop files or{' '}
            <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
              browse
              <input
                type="file"
                multiple
                onChange={handleFileSelection}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Multiple files supported
          </p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Files ({files.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                    {/* Progress indicator */}
                    {uploadProgress[file.name] !== undefined && (
                      <div className="mt-2">
                        {uploadProgress[file.name] === -1 ? (
                          <span className="text-red-500 text-xs">❌ Failed</span>
                        ) : uploadProgress[file.name] === 100 ? (
                          <span className="text-green-500 text-xs">Uploaded</span>
                        ) : (
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="ml-1 p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Metadata */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Shared Metadata
          </h4>
          <div className="space-y-2">
            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={sharedMetadata.department}
                onChange={(e) => handleMetadataChange('department', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {departmentOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={sharedMetadata.document_type}
                onChange={(e) => handleMetadataChange('document_type', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {documentTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={sharedMetadata.priority}
                onChange={(e) => handleMetadataChange('priority', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Period
              </label>
              <select
                value={sharedMetadata.date_range}
                onChange={(e) => handleMetadataChange('date_range', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project
              </label>
              <input
                type="text"
                value={sharedMetadata.project}
                onChange={(e) => handleMetadataChange('project', e.target.value)}
                placeholder="Project name"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={sharedMetadata.tags}
                onChange={(e) => handleMetadataChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Corporate Upload Summary */}
        {files.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-medium text-blue-900 dark:text-blue-300">
                  {files.length} files ready
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  Est. ${estimatedCost.toFixed(3)}
                </div>
              </div>
              <button
                onClick={handleBatchUpload}
                disabled={isUploading}
                className={`px-3 py-2 text-xs font-semibold rounded transition-colors ${
                  isUploading
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}