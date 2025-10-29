import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';

const FileUpload = ({ onFilesUploaded, onAnalysisComplete }) => {
  const { darkMode } = useDarkMode();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    try {
      const response = await fetch('/api/upload_csv', {
        method: 'POST',
        body: createFormData(files),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadedFiles(prev => [...(prev || []), ...files.map(f => f.name)]);
      
      if (onFilesUploaded) {
        onFilesUploaded(result);
      }

      // Automatically analyze uploaded files
      await analyzeFiles();
      
      // Auto-minimize after successful upload
      setIsMinimized(true);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const createFormData = (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return formData;
  };

  const analyzeFiles = async () => {
    try {
      const response = await fetch('/api/analyze_csvs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4"
      >
        <div className={`border-2 border-emerald-400 dark:border-emerald-500 rounded-lg px-4 py-2 transition-all duration-200 ${
          darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {uploadedFiles.length} file(s) uploaded
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Expand
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div
        className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
        } ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Minimize Button */}
        <div className="flex justify-end p-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Upload CSV Files
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop CSV files here, or click to browse
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openFileDialog}
            disabled={isUploading}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isUploading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="px-8">
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Uploaded Files:
              </h4>
              <div className="space-y-1">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="text-sm text-emerald-600 dark:text-emerald-400">
                    ✓ {fileName}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FileUpload;
