import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start pt-[20vh] justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-2xl border-2 border-red-500 dark:border-red-600 overflow-hidden scale-in-95 animate-in duration-200">
        {/* Header de Alerta */}
        <div className="bg-red-50 dark:bg-red-900/30 px-4 py-3 flex items-center gap-3 border-b border-red-100 dark:border-red-800/50">
          <div className="shrink-0 p-2 bg-red-100 dark:bg-red-800 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-200" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-300 leading-none">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-4 text-slate-600 dark:text-slate-300 text-sm">
          <p>{message}</p>
        </div>

        {/* Footer de Acciones Técnico */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;