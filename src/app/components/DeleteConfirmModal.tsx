'use client';

// Created: 2025-01-08 23:30:00 - Custom delete confirmation modal

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  fileName, 
  onConfirm, 
  onCancel 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🗑️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Delete File
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete this file?
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
            <p className="font-medium text-gray-900 dark:text-white text-sm break-all">
              {fileName}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-400 text-sm">
              ⚠️ <strong>Warning:</strong> This action cannot be undone. The file and all its associated data will be permanently removed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-red-500 transform hover:scale-105"
          >
            🗑️ Delete File
          </button>
        </div>
      </div>
    </div>
  );
}