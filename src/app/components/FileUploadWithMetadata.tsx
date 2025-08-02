'use client';

// Updated: 2025-01-08 22:45:00 - Single file upload with comprehensive metadata options

import { useState } from 'react';

interface FileUploadWithMetadataProps {
  onUploadSuccess: () => void;
}

export default function FileUploadWithMetadata({ onUploadSuccess }: FileUploadWithMetadataProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    department: '',
    document_type: '',
    priority: '',
    date_range: '',
    category: '',
    tags: '',
    project: '',
    version: '',
    description: ''
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Clean metadata - remove empty values and process tags
      const cleanMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
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

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('File uploaded successfully!');
        setFile(null);
        setMetadata({
          department: '',
          document_type: '',
          priority: '',
          date_range: '',
          category: '',
          tags: '',
          project: '',
          version: '',
          description: ''
        });
        onUploadSuccess();
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          File Upload
        </h3>
        <p className="text-xs text-orange-700 dark:text-orange-300 mb-3 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-700">
          ⚠️ <strong>Important:</strong> Metadata can only be set during upload and cannot be modified afterward due to the way the data is stored in the database. Plan your metadata structure carefully.
        </p>

        <form onSubmit={handleUpload} className="space-y-3">
          {/* File Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Compact Metadata Fields */}
          <div className="space-y-2">
            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={metadata.department}
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
                value={metadata.document_type}
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
                value={metadata.priority}
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
                Period
              </label>
              <select
                value={metadata.date_range}
                onChange={(e) => handleMetadataChange('date_range', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={metadata.category}
                onChange={(e) => handleMetadataChange('category', e.target.value)}
                placeholder="API Documentation"
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project
              </label>
              <input
                type="text"
                value={metadata.project}
                onChange={(e) => handleMetadataChange('project', e.target.value)}
                placeholder="Q1 2025 Analysis"
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={metadata.tags}
                onChange={(e) => handleMetadataChange('tags', e.target.value)}
                placeholder="integration, guide"
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => handleMetadataChange('description', e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Corporate Upload Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors ${
                !file || isUploading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}