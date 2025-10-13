// src/components/FileUploader.tsx

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X, CheckCircle, Loader2 } from 'lucide-react';
import { processFile } from '../utils/fileProcessor'; // Asumiendo que tienes esta utilidad
import { InventoryItem } from '../types/inventory'; // Asumiendo que tienes estos tipos

interface FileUploaderProps {
  onFilesProcessed: (data: InventoryItem[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesProcessed, isProcessing, setIsProcessing }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['xlsx', 'xls', 'csv'].includes(extension || '');
    });

    if (validFiles.length === 0) {
      alert('Por favor selecciona archivos válidos (.xlsx, .xls o .csv)');
      return;
    }
    if (validFiles.length > 10) {
      alert('Máximo 10 archivos permitidos');
      return;
    }
    const newFiles: UploadedFile[] = validFiles.map(file => ({ file, status: 'pending' }));
    setUploadedFiles(newFiles);
    startProcessing(newFiles);
  };

  const startProcessing = async (files: UploadedFile[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(old => (old < 90 ? old + Math.random() * 5 : old));
    }, 200);

    try {
      const allData = await processFile(files.map(f => f.file));
      clearInterval(interval);
      setProgress(100);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
      onFilesProcessed(allData);
    } catch (error) {
      clearInterval(interval);
      console.error("Error en el procesamiento de archivos:", error);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' })));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };
  
  const clearAll = () => {
    setUploadedFiles([]);
    setProgress(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Cargar Archivos de Inventario
      </h2>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Arrastra y suelta tus archivos aquí
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          (Listados de Productos y Productos Vendidos de cada farmacia)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
          disabled={isProcessing}
        >
          Seleccionar Archivos
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Máximo 10 archivos
        </p>
        <input ref={fileInputRef} type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
      </div>

      {isProcessing && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Procesando archivos...</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Archivos ({uploadedFiles.length})</h3>
            {!isProcessing && (
              <button onClick={clearAll} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Limpiar todo
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {uploadedFiles.map(({ file, status, error }) => (
              <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3 min-w-0">
                  <File className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                  {status === 'error' && <span className="text-xs text-red-500" title={error}>Error</span>}
                  
                  {!isProcessing && (
                    <button onClick={() => removeFile(file.name)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                      <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;