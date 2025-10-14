import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { ClassificationSettings } from '../types/inventory';

interface ClassificationSettingsProps {
  settings: ClassificationSettings;
  onSettingsChange: (settings: ClassificationSettings) => void;
}

const ClassificationSettingsComponent: React.FC<ClassificationSettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<ClassificationSettings>(settings);

  // Sincroniza el estado local si las props externas cambian
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Comprueba si hay cambios sin guardar para activar el botón
  const hasChanges = useMemo(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(settings);
  }, [localSettings, settings]);

  const handleSave = () => {
    if (localSettings.diasFalla >= localSettings.diasExceso) {
      alert('"Días para Falla" debe ser menor que "Días para Exceso".');
      return;
    }
    
    // El rango OK se deriva de los otros dos valores
    const newSettings = {
        ...localSettings,
        diasOK: { min: localSettings.diasFalla, max: localSettings.diasExceso }
    };
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    const defaultSettings: ClassificationSettings = {
      diasFalla: 20,
      diasExceso: 60,
      diasOK: { min: 20, max: 60 }
    };
    setLocalSettings(defaultSettings);
    // Opcional: podrías guardar directamente al restaurar
    // onSettingsChange(defaultSettings); 
  };
  
  // Componente interno para cada fila de ajuste
  const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-2 items-center gap-3">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {label}
      </label>
      {children}
    </div>
  );

  return (
    // El contenedor principal ya no necesita ser una "tarjeta" completa, 
    // ya que se anida dentro de un panel en App.tsx.
    <div className="space-y-4">
      
      {/* --- Campo: Días para Falla --- */}
      <SettingRow label="Días de Falla">
        <input
          type="number"
          value={localSettings.diasFalla}
          onChange={(e) => setLocalSettings({ 
            ...localSettings, 
            diasFalla: parseInt(e.target.value, 10) || 0 
          })}
          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          min="1"
          max="365"
        />
      </SettingRow>

      {/* --- Campo: Días para Exceso --- */}
      <SettingRow label="Días de Exceso">
        <input
          type="number"
          value={localSettings.diasExceso}
          onChange={(e) => setLocalSettings({ 
            ...localSettings, 
            diasExceso: parseInt(e.target.value, 10) || 0 
          })}
          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          min="1"
          max="365"
        />
      </SettingRow>

      {/* --- Campo: Rango OK (calculado) --- */}
      <SettingRow label="Rango Óptimo">
        <div className="text-sm text-center font-mono text-slate-700 dark:text-slate-300 px-2 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-md">
          {localSettings.diasFalla} - {localSettings.diasExceso} días
        </div>
      </SettingRow>

      {/* --- Botones de Acción --- */}
      <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleReset}
          title="Restaurar valores por defecto"
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex items-center space-x-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200
            ${hasChanges 
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
        >
          <Save className="h-4 w-4" />
          <span>Aplicar</span>
        </button>
      </div>
    </div>
  );
};

export default ClassificationSettingsComponent;