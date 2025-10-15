import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X, CheckCircle, Loader2 } from 'lucide-react';
import { processFile } from '../utils/fileProcessor';
import { InventoryItem, ClassificationSettings } from '../types/inventory';

interface FileUploaderProps {
  onFilesProcessed: (data: InventoryItem[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  classificationSettings: ClassificationSettings;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesProcessed, isProcessing, setIsProcessing, classificationSettings }) => {
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
      e.target.value = '';
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

    if (uploadedFiles.length + validFiles.length > 10) {
      alert('Máximo 10 archivos permitidos en total');
      return;
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({ file, status: 'pending' }));
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleProcessClick = () => {
    if (uploadedFiles.length > 0) {
      startProcessing(uploadedFiles);
    }
  };

  const startProcessing = async (filesToProcess: UploadedFile[]) => {
    setIsProcessing(true);
    setProgress(0);

    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));

    const interval = setInterval(() => {
      setProgress(old => (old < 90 ? old + Math.random() * 5 : old));
    }, 200);

    try {
      const allData = await processFile(filesToProcess.map(f => f.file), classificationSettings);
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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
        Cargar Archivos de Inventario
      </h2>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5'
        }`}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400 mb-4" />
        <p className="text-lg font-medium text-slate-800 dark:text-white mb-2">
          Arrastra archivos aquí
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          Listados de Productos y Productos Vendidos
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isProcessing}
        >
          Seleccionar Archivos
        </button>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Máximo 10 archivos</p>
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileInput} 
          className="hidden" 
        />
      </div>

      {isProcessing && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Procesando...</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Archivos ({uploadedFiles.length})
            </h3>
            {!isProcessing && (
              <button 
                onClick={clearAll} 
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {uploadedFiles.map(({ file, status, error }) => (
              <div 
                key={file.name} 
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <File className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-300 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                  {status === 'error' && (
                    <span className="text-xs text-red-500 dark:text-red-400" title={error}>
                      Error
                    </span>
                  )}
                  
                  {!isProcessing && status === 'pending' && (
                    <button 
                      onClick={() => removeFile(file.name)} 
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                    >
                      <X className="h-3 w-3 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && !isProcessing && (
        <div className="mt-6">
          <button
            onClick={handleProcessClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploadedFiles.some(f => f.status !== 'pending')}
          >
            Procesar {uploadedFiles.length} {uploadedFiles.length === 1 ? 'archivo' : 'archivos'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;