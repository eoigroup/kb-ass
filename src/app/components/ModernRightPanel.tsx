// Updated: 2025-01-08 19:38:00 - Added reset button to Context Controls (defaults: 16 snippets, 2048 size)
// Modern Right Panel Component - Clean, polished design
'use client';

import { useState } from 'react';
import AssistantFiles from './AssistantFiles';
import FileManagementTabs from './FileManagementTabs';
import { formatEvaluationMetrics, getEntailmentDisplay, EvaluationResponse } from '../utils/evaluationUtils';

interface ModernRightPanelProps {
  rightPanelView: 'showcase' | 'files';
  setRightPanelView: (view: 'showcase' | 'files') => void;
  showCitationsInChat: boolean;
  setShowCitationsInChat: (value: boolean) => void;
  enableEvaluation: boolean;
  setEnableEvaluation: (value: boolean) => void;
  groundTruthAnswer: string;
  setGroundTruthAnswer: (value: string) => void;
  filterOptions: any;
  setFilterOptions: (options: any) => void;
  contextOptions: any;
  setContextOptions: (options: any) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  includeHighlights: boolean;
  setIncludeHighlights: (value: boolean) => void;
  includeMessageHistory: boolean;
  setIncludeMessageHistory: (value: boolean) => void;
  currentResponseMeta: any;
  showDebugMode: boolean;
  files: any[];
}

export default function ModernRightPanel({
  rightPanelView,
  setRightPanelView,
  showCitationsInChat,
  setShowCitationsInChat,
  enableEvaluation,
  setEnableEvaluation,
  groundTruthAnswer,
  setGroundTruthAnswer,
  filterOptions,
  setFilterOptions,
  contextOptions,
  setContextOptions,
  temperature,
  setTemperature,
  includeHighlights,
  setIncludeHighlights,
  includeMessageHistory,
  setIncludeMessageHistory,
  currentResponseMeta,
  showDebugMode,
  files,
}: ModernRightPanelProps) {
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  return (
    <div className="w-96 bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-l border-gray-200/80 dark:border-gray-700/80 flex flex-col h-full shadow-2xl shadow-gray-900/5 dark:shadow-black/20">
      {/* Corporate Header - Fixed at top */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-780 dark:to-gray-800 border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
        {/* Corporate Title Section */}
        <div className="mb-4">
          <h2 className="text-lg font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-1 flex items-center tracking-tight">
            {rightPanelView === 'files' ? (
              <>
                <span className="text-lg mr-2 drop-shadow-sm">📚</span>
                Knowledge Base
              </>
            ) : (
              <>
                <span className="text-lg mr-2 drop-shadow-sm">🔬</span>
                Response Lab
              </>
            )}
          </h2>
        </div>

        {/* Corporate View Toggle */}
        <div className="flex p-1 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-700 dark:via-gray-750 dark:to-gray-700 rounded-xl shadow-inner border border-gray-200/50 dark:border-gray-600/50 relative z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Lab button clicked');
              setRightPanelView('showcase');
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              rightPanelView === 'showcase'
                ? 'bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-600 dark:via-gray-550 dark:to-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/15 border border-indigo-200/50 dark:border-indigo-400/30'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/30'
            }`}
          >
            <span className="text-base">🔬</span>
            <span>Lab</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Files button clicked');
              setRightPanelView('files');
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              rightPanelView === 'files'
                ? 'bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-600 dark:via-gray-550 dark:to-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/15 border border-indigo-200/50 dark:border-indigo-400/30'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/30'
            }`}
          >
            <span className="text-base">📚</span>
            <span>Files</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelView === 'files' ? (
          <div className="p-2">
            <FileManagementTabs 
              files={files} 
              referencedFiles={[]}
              onFilesChange={() => window.location.reload()} 
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Corporate Token Usage Display */}
            {currentResponseMeta.usage && (
              <div className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-790 dark:to-gray-800 rounded-xl p-4 border border-gray-200/60 dark:border-gray-700/60 shadow-md shadow-gray-900/5 dark:shadow-black/20">
                <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3 flex items-center tracking-tight">
                  <span className="text-lg mr-2 drop-shadow-sm">📊</span>
                  Token Usage
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 px-2.5 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{currentResponseMeta.usage.total_tokens?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Prompt:</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{currentResponseMeta.usage.prompt_tokens?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2.5 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Completion:</span>
                    <span className="font-semibold text-green-900 dark:text-green-300 text-sm">{currentResponseMeta.usage.completion_tokens?.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: currentResponseMeta.usage.completion_tokens && currentResponseMeta.usage.total_tokens 
                          ? `${(currentResponseMeta.usage.completion_tokens / currentResponseMeta.usage.total_tokens) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center bg-gray-100/50 dark:bg-gray-600/30 py-1.5 px-3 rounded-lg">
                    💰 Est. cost: <span className="font-bold text-gray-900 dark:text-white">${((currentResponseMeta.usage.total_tokens || 0) / 1000000 * 16).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Corporate Quick Actions Card */}
            <div className="bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 dark:from-blue-900/25 dark:via-blue-800/20 dark:to-indigo-900/25 rounded-xl p-3 border border-blue-200/60 dark:border-blue-700/60 shadow-md shadow-blue-500/5 dark:shadow-blue-900/20">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center tracking-tight">
                <span className="text-sm mr-2 drop-shadow-sm">⚡</span>
                Quick Actions per/response
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-800 dark:text-blue-300">Citations</label>
                  <button
                    onClick={() => setShowCitationsInChat(!showCitationsInChat)}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      showCitationsInChat
                        ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-500 text-white shadow-md shadow-green-500/20 border border-green-400/50'
                        : 'bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 shadow-sm'
                    }`}
                  >
                    {showCitationsInChat ? '✓ ON' : 'OFF'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-800 dark:text-blue-300">Evaluation</label>
                  <button
                    onClick={() => setEnableEvaluation(!enableEvaluation)}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      enableEvaluation
                        ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/20 border border-purple-400/50'
                        : 'bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 shadow-sm'
                    }`}
                  >
                    {enableEvaluation ? '✓ ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Corporate Ground Truth Input */}
            {enableEvaluation && (
              <div className="bg-gradient-to-br from-purple-50 via-purple-25 to-pink-50 dark:from-purple-900/25 dark:via-purple-800/20 dark:to-pink-900/25 rounded-xl p-3 border border-purple-200/60 dark:border-purple-700/60 shadow-md shadow-purple-500/5 dark:shadow-purple-900/20">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center tracking-tight">
                  <span className="text-sm mr-2 drop-shadow-sm">📝</span>
                  Ground Truth
                </label>
                <textarea
                  value={groundTruthAnswer}
                  onChange={(e) => setGroundTruthAnswer(e.target.value)}
                  placeholder="Enter the expected correct answer for evaluation..."
                  className="w-full px-3 py-2 text-xs border border-purple-200/60 dark:border-purple-700/60 rounded-lg bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  rows={2}
                />
              </div>
            )}

            {/* Corporate Advanced Settings */}
            <div className="bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-gray-800 dark:via-gray-790 dark:to-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden shadow-md shadow-gray-900/5 dark:shadow-black/20">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Advanced settings clicked, current state:', showAdvancedControls);
                  setShowAdvancedControls(!showAdvancedControls);
                }}
                className="w-full p-3 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/30 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center tracking-tight">
                    <span className="text-sm mr-2 drop-shadow-sm">⚙️</span>
                    Advanced Settings
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      showAdvancedControls ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showAdvancedControls && (
                <div className="px-3 pb-3 space-y-3 animate-fade-in bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-700/20">
                  {/* Quick Presets */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center tracking-tight">
                      <span className="text-sm mr-2 drop-shadow-sm">🎯</span>
                      Quick Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: '🫀 Cardiology', filters: { specialty: 'cardiology', userRole: 'physician' } },
                        { name: '🔬 Diagnostics', filters: { resource: 'diagnostics', userRole: 'physician' } },
                        { name: '📊 Markets', filters: { resource: 'market_analysis', userRole: 'analyst' } },
                        { name: '💻 Digital', filters: { resource: 'digital_health', userRole: 'executive' } },
                        { name: '👤 Patient', filters: { userRole: 'patient' } },
                        { name: '🔄 Reset', filters: { specialty: '', documentType: '', userRole: '', resource: '' } },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setFilterOptions({...filterOptions, ...preset.filters})}
                          className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                            preset.name === '🔄 Reset'
                              ? 'bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                              : 'bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:via-indigo-800/30 dark:to-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:shadow-md shadow-indigo-500/10 border border-indigo-200/60 dark:border-indigo-700/60'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Premium Document Filters */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center tracking-tight">
                      <span className="text-lg mr-3 drop-shadow-sm">📁</span>
                      Document Filters
                    </label>
                    <div className="space-y-3">
                      <select
                        value={filterOptions.resource}
                        onChange={(e) => setFilterOptions({...filterOptions, resource: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">📚 All Resources</option>
                        <option value="diagnostics">🔬 Diagnostics</option>
                        <option value="private_healthcare">🏥 Private Healthcare</option>
                        <option value="market_analysis">📊 Market Analysis</option>
                        <option value="digital_health">💻 Digital Health</option>
                        <option value="care_markets">👥 Care Markets</option>
                      </select>
                      <select
                        value={filterOptions.userRole}
                        onChange={(e) => setFilterOptions({...filterOptions, userRole: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">👥 All Users</option>
                        <option value="physician">👨‍⚕️ Physician</option>
                        <option value="patient">👤 Patient</option>
                        <option value="analyst">📈 Analyst</option>
                        <option value="executive">💼 Executive</option>
                      </select>
                    </div>
                  </div>

                  {/* File Metadata Filters */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center tracking-tight">
                      <span className="text-lg mr-3 drop-shadow-sm">🏷️</span>
                      Metadata Filters
                    </label>
                    <div className="space-y-3">
                      <select
                        value={filterOptions.department || ''}
                        onChange={(e) => setFilterOptions({...filterOptions, department: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">🏢 All Departments</option>
                        <option value="engineering">🔧 Engineering</option>
                        <option value="marketing">📢 Marketing</option>
                        <option value="sales">💼 Sales</option>
                        <option value="finance">💰 Finance</option>
                        <option value="hr">👥 HR</option>
                        <option value="legal">⚖️ Legal</option>
                        <option value="operations">⚙️ Operations</option>
                      </select>
                      <select
                        value={filterOptions.document_type || ''}
                        onChange={(e) => setFilterOptions({...filterOptions, document_type: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">📋 All Document Types</option>
                        <option value="manual">📖 Manual</option>
                        <option value="report">📊 Report</option>
                        <option value="policy">📋 Policy</option>
                        <option value="contract">📜 Contract</option>
                        <option value="guide">🗺️ Guide</option>
                        <option value="analysis">📈 Analysis</option>
                        <option value="specification">📐 Specification</option>
                      </select>
                      <select
                        value={filterOptions.priority || ''}
                        onChange={(e) => setFilterOptions({...filterOptions, priority: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">⭐ All Priorities</option>
                        <option value="high">🔴 High Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="low">🟢 Low Priority</option>
                      </select>
                      <select
                        value={filterOptions.date_range || ''}
                        onChange={(e) => setFilterOptions({...filterOptions, date_range: e.target.value})}
                        className="w-full px-4 py-3 text-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <option value="">📅 All Time Periods</option>
                        <option value="2024-q1">📈 Q1 2024</option>
                        <option value="2024-q2">📈 Q2 2024</option>
                        <option value="2024-q3">📈 Q3 2024</option>
                        <option value="2024-q4">📈 Q4 2024</option>
                        <option value="2025-q1">📈 Q1 2025</option>
                        <option value="2025-q2">📈 Q2 2025</option>
                        <option value="recent">📅 Recent (Last 6 months)</option>
                        <option value="archive">📂 Archive (Older)</option>
                      </select>
                    </div>
                  </div>

                  {/* Premium Context Controls */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center tracking-tight">
                        <span className="text-lg mr-3 drop-shadow-sm">🎛️</span>
                        Context Controls
                      </label>
                      <button
                        onClick={() => setContextOptions({ snippetSize: 2048, topK: 16 })}
                        className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-750 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
                        title="Reset to defaults: 16 snippets, 2048 size"
                      >
                        🔄 Reset
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center group relative">
                            <span>📄 Snippets</span>
                            <span className="ml-1 text-xs text-gray-400 cursor-help">ⓘ</span>
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-72 border border-gray-700 dark:border-gray-500">
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                              How many document pieces to search through for answers (more = broader search, fewer = faster)
                            </div>
                          </div>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{contextOptions.topK}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={contextOptions.topK}
                          onChange={(e) => setContextOptions({...contextOptions, topK: parseInt(e.target.value)})}
                          className="w-full h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb shadow-inner"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center group relative">
                            <span>📝 Size</span>
                            <span className="ml-1 text-xs text-gray-400 cursor-help">ⓘ</span>
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-72 border border-gray-700 dark:border-gray-500">
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                              How much text to read from each document piece (larger = more context, smaller = more focused)
                            </div>
                          </div>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{contextOptions.snippetSize}</span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max="4000"
                          step="100"
                          value={contextOptions.snippetSize}
                          onChange={(e) => setContextOptions({...contextOptions, snippetSize: parseInt(e.target.value)})}
                          className="w-full h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-650 dark:to-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temperature Control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <span className="text-lg mr-2">🌡️</span>
                        Temperature
                      </label>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {temperature.toFixed(1)} ({temperature < 0.3 ? 'Precise' : temperature < 0.7 ? 'Balanced' : 'Creative'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-thumb"
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="text-lg mr-2">🎨</span>
                      Options
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                        <input
                          type="checkbox"
                          id="includeHighlights"
                          checked={includeHighlights}
                          onChange={(e) => setIncludeHighlights(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <label htmlFor="includeHighlights" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          ✨ Citation Highlights
                        </label>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700 group relative">
                        <input
                          type="checkbox"
                          id="includeMessageHistory"
                          checked={includeMessageHistory}
                          onChange={(e) => setIncludeMessageHistory(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <label htmlFor="includeMessageHistory" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          💬 Include Message History
                        </label>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                          When enabled, sends entire conversation history to AI for better context. When disabled, only sends current message for cost efficiency (recommended for simple queries).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Analytics Cards */}
            {/* Truth Engine */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🛡️</span>
                Truth Engine
              </h3>
              
              {/* Evaluation Metrics */}
              {currentResponseMeta.evaluationData?.metrics ? (
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Answer Quality</h4>
                  {formatEvaluationMetrics(currentResponseMeta.evaluationData.metrics).map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.key}</span>
                        <span className={`text-sm font-bold ${metric.color}`}>
                          {metric.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            metric.key === 'Correctness' ? 'bg-green-500' :
                            metric.key === 'Completeness' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ width: metric.value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enableEvaluation ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                    <span className="text-lg mr-2">⚠️</span>
                    Evaluation enabled - Add ground truth to see quality metrics
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="text-lg mr-2">🎯</span>
                    Enable evaluation to see answer quality metrics
                  </p>
                </div>
              )}

              {/* Context Relevance */}
              {currentResponseMeta.contextData?.matches?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Context Relevance</h4>
                  {currentResponseMeta.contextData.matches.slice(0, 3).map((match: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                          {match.metadata?.filename || `Source ${index + 1}`}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {(match.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${match.score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Citation Highlights */}
            {currentResponseMeta.highlights?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  Citation Highlights
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {currentResponseMeta.highlights.slice(0, 5).map((highlight: any, index: number) => (
                    <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Highlight {index + 1}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        &quot;{highlight.content?.substring(0, 150)}{highlight.content?.length > 150 ? '...' : ''}&quot;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Analytics */}
            {showDebugMode && currentResponseMeta.requestParams && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  Debug Analytics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentResponseMeta.requestParams.temperature}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Snippets:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentResponseMeta.requestParams.contextOptions?.topK || 'Default'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentResponseMeta.requestParams.contextOptions?.snippetSize || 'Default'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Highlights:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentResponseMeta.requestParams.includeHighlights ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}