import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, Loader2, AlertOctagon, FileUp } from 'lucide-react';
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

  // --- HANDLERS (Lógica intacta) ---
  const handleDrag = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') { setDragActive(true); } else if (e.type === 'dragleave') { setDragActive(false); } };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const files = Array.from(e.dataTransfer.files); handleFiles(files); };
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) { const files = Array.from(e.target.files); handleFiles(files); e.target.value = ''; } };
  
  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => ['xlsx', 'xls', 'csv'].includes(file.name.split('.').pop()?.toLowerCase() || ''));
    if (validFiles.length === 0) { alert('Formato no válido. Usa .xlsx, .xls o .csv'); return; }
    if (uploadedFiles.length + validFiles.length > 10) { alert('Límite de 10 archivos excedido'); return; }
    setUploadedFiles(prev => [...prev, ...validFiles.map(file => ({ file, status: 'pending' } as UploadedFile))]);
  };

  const handleProcessClick = () => { if (uploadedFiles.length > 0) startProcessing(uploadedFiles); };

  const startProcessing = async (filesToProcess: UploadedFile[]) => {
    setIsProcessing(true); setProgress(0);
    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));
    const interval = setInterval(() => { setProgress(old => (old < 90 ? old + Math.random() * 15 : old)); }, 150);
    try {
      const allData = await processFile(filesToProcess.map(f => f.file), classificationSettings);
      clearInterval(interval); setProgress(100);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
      setTimeout(() => onFilesProcessed(allData), 600);
    } catch (error) {
      clearInterval(interval);
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' })));
    } finally { setIsProcessing(false); }
  };

  const removeFile = (fileName: string) => { setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName)); };
  const clearAll = () => { setUploadedFiles([]); setProgress(0); };

  return (
    <div className="w-full flex flex-col gap-3"> {/* Gap reducido de 4 a 3 */}
      
      {/* --- AREA DE CARGA (DROPZONE) COMPACTA --- */}
      <div
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer group
          ${dragActive 
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 scale-[1.01] shadow-lg shadow-blue-500/10' 
            : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Padding vertical reducido drásticamente */}
        <div className="flex flex-col items-center justify-center py-5 sm:py-8 px-4 text-center">
          {/* Icono más pequeño y con menos padding */}
          <div className={`
            p-3 rounded-full bg-slate-100 dark:bg-slate-700 mb-2 transition-transform duration-300
            ${dragActive ? 'scale-110 text-blue-600' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 group-hover:scale-105'}
          `}>
             {/* Tamaño de icono reducido a 28 */}
             {dragActive ? <FileUp size={28} /> : <UploadCloud size={28} />}
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="hidden sm:inline">Arrastra archivos o </span>
              <span className="text-blue-600 dark:text-blue-400">haz click</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              .xlsx, .xls, .csv (Máx 10)
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        )}
        <input ref={fileInputRef} type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
      </div>

      {/* --- LISTA DE ARCHIVOS Y ACCIONES --- */}
      {(uploadedFiles.length > 0 || isProcessing) && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Header más compacto */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileSpreadsheet size={14} /> Lista ({uploadedFiles.length})
            </h3>
            {!isProcessing && (
              <button onClick={clearAll} className="text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors">
                Limpiar
              </button>
            )}
          </div>

          {/* Lista Scrollable con items más compactos */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {uploadedFiles.map(({ file, status, error }, idx) => (
              <div 
                key={`${file.name}-${idx}`} 
                className={`
                  flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm
                  ${status === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30' : 
                    status === 'completed' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30' :
                    'border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700'}
                `}
              >
                <div className="shrink-0">
                  {status === 'processing' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                  {status === 'completed' && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {status === 'error' && <AlertOctagon size={16} className="text-red-500" />}
                  {status === 'pending' && <FileSpreadsheet size={16} className="text-slate-400" />}
                </div>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
                    <span>{(file.size / 1024).toFixed(0)}KB</span>
                    {error && <span className="text-red-500 font-sans font-bold hidden sm:inline truncate max-w-[100px]">• {error}</span>}
                  </div>
                  {error && <span className="text-red-500 text-xs font-bold sm:hidden truncate">{error}</span>}
                </div>

                {!isProcessing && status === 'pending' && (
                  <button 
                    onClick={() => removeFile(file.name)} 
                    className="p-1 -mr-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer con Botón Principal más compacto */}
          {!isProcessing && uploadedFiles.some(f => f.status === 'pending') && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={handleProcessClick}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                <span>Procesar {uploadedFiles.length}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;