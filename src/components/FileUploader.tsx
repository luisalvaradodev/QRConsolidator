import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { processFile } from '../utils/fileProcessor';
import { InventoryItem } from '../types/inventory';

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

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesProcessed,
  isProcessing,
  setIsProcessing
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'xlsx' || extension === 'xls' || extension === 'csv';
    });

    if (validFiles.length === 0) {
      alert('Por favor selecciona archivos válidos (.xlsx, .xls o .csv)');
      return;
    }

    if (validFiles.length > 10) {
      alert('Máximo 10 archivos permitidos');
      return;
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      status: 'pending'
    }));

    setUploadedFiles(newFiles);
    processFiles(newFiles);
  };

  const processFiles = async (files: UploadedFile[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    const allData: InventoryItem[] = [];
    let processedCount = 0;

    for (const uploadedFile of files) {
      setUploadedFiles(prev => prev.map(f => 
        f.file.name === uploadedFile.file.name 
          ? { ...f, status: 'processing' }
          : f
      ));

      try {
        const data = await processFile(uploadedFile.file);
        allData.push(...data);
        
        setUploadedFiles(prev => prev.map(f => 
          f.file.name === uploadedFile.file.name 
            ? { ...f, status: 'completed' }
            : f
        ));
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.file.name === uploadedFile.file.name 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' }
            : f
        ));
      }

      processedCount++;
      setProgress((processedCount / files.length) * 100);
    }

    setIsProcessing(false);
    onFilesProcessed(allData);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setProgress(0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Cargar Archivos de Inventario
      </h2>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Arrastra y suelta tus archivos aquí
        </p>
        <p className="text-gray-600 mb-4">
          o haz clic para seleccionar archivos (.xlsx, .xls, .csv)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          disabled={isProcessing}
        >
          Seleccionar Archivos
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Máximo 10 archivos
        </p>
        
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
            <span className="text-sm font-medium text-gray-700">
              Procesando archivos...
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">
              Archivos ({uploadedFiles.length})
            </h3>
            {!isProcessing && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpiar todo
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((uploadedFile) => (
              <div 
                key={uploadedFile.file.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {uploadedFile.status === 'processing' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {uploadedFile.status === 'error' && (
                    <span className="text-xs text-red-500" title={uploadedFile.error}>
                      Error
                    </span>
                  )}
                  {!isProcessing && (
                    <button
                      onClick={() => removeFile(uploadedFile.file.name)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-3 w-3 text-gray-500" />
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