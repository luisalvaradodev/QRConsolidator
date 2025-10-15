import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Plus, X } from 'lucide-react';
import { ClassificationSettings } from '../types/inventory';

interface ClassificationSettingsProps {
  settings: ClassificationSettings;
  onSettingsChange: (settings: ClassificationSettings) => void;
}

const ClassificationSettingsComponent: React.FC<ClassificationSettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<ClassificationSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(settings);
  }, [localSettings, settings]);

  const handleSave = () => {
    if (localSettings.diasFalla >= localSettings.diasExceso) {
      alert('"Días para Falla" debe ser menor que "Días para Exceso".');
      return;
    }

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
      diasOK: { min: 20, max: 60 },
      periodos: [30, 40, 50, 60]
    };
    setLocalSettings(defaultSettings);
  };

  const handlePeriodoChange = (index: number, value: string) => {
    const newPeriodos = [...localSettings.periodos];
    newPeriodos[index] = parseInt(value, 10) || 0;
    setLocalSettings({ ...localSettings, periodos: newPeriodos });
  };

  const addPeriodo = () => {
    setLocalSettings({ ...localSettings, periodos: [...localSettings.periodos, 0] });
  };

  const removePeriodo = (index: number) => {
    const newPeriodos = localSettings.periodos.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, periodos: newPeriodos });
  };

  const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <SettingRow label="Días de Falla">
        <input
          type="number"
          value={localSettings.diasFalla}
          onChange={(e) => setLocalSettings({
            ...localSettings,
            diasFalla: parseInt(e.target.value, 10) || 0
          })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          min="1"
          max="365"
        />
      </SettingRow>

      <SettingRow label="Días de Exceso">
        <input
          type="number"
          value={localSettings.diasExceso}
          onChange={(e) => setLocalSettings({ 
            ...localSettings, 
            diasExceso: parseInt(e.target.value, 10) || 0 
          })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          min="1"
          max="365"
        />
      </SettingRow>

      <SettingRow label="Rango Óptimo">
        <div className="text-sm text-center font-mono text-slate-700 dark:text-slate-300 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
          {localSettings.diasFalla} - {localSettings.diasExceso} días
        </div>
      </SettingRow>

      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">Períodos de Cálculo</h4>
          <button 
            onClick={addPeriodo} 
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Plus className="h-4 w-4" /> 
            Añadir
          </button>
        </div>
        
        <div className="space-y-2">
          {localSettings.periodos.map((periodo, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="number"
                value={periodo}
                onChange={(e) => handlePeriodoChange(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                min="1"
                placeholder="Días"
              />
              <button 
                onClick={() => removePeriodo(index)} 
                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end items-center space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleReset}
          title="Restaurar valores por defecto"
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
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