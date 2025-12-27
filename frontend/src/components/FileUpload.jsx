import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/apiService';

const FileUpload = ({ onFilesUploaded, onAnalysisComplete }) => {
  const { user } = useAuth();
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
      // Use ApiService instead of raw fetch
      const result = await ApiService.uploadCSVFiles(files, user?.token);

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
      alert('Failed to upload files. please check your connection or login status.');
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeFiles = async () => {
    try {
      // Use ApiService
      const result = await ApiService.analyzeCSVFiles(user?.token);

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
      <div className="mb-4">
        <div className="flex items-center justify-between rounded-md border bg-background p-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">
              {uploadedFiles.length} file(s) uploaded
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 transition-all duration-200 ease-in-out text-center",
          isDragOver ? "border-primary bg-muted/50" : "border-muted-foreground/20 hover:border-primary/50",
          "bg-card text-card-foreground"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          title="Minimize"
        >
          <Minimize2 className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-muted rounded-full">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-semibold mb-1">Upload CSV Files</h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
          </div>

          <Button
            onClick={openFileDialog}
            disabled={isUploading}
            size="sm"
            className="gap-2"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 pt-4 border-t w-full">
            <h4 className="text-xs font-semibold text-left mb-2 text-muted-foreground uppercase tracking-wider">
              Uploaded Files
            </h4>
            <div className="space-y-1">
              {uploadedFiles.map((fileName, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-3 w-3 text-primary" />
                  {fileName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
