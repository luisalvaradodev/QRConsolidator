import React, { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { ClassificationSettings } from '../types/inventory';

interface ClassificationSettingsProps {
  settings: ClassificationSettings;
  onSettingsChange: (settings: ClassificationSettings) => void;
}

const ClassificationSettingsComponent: React.FC<ClassificationSettingsProps> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<ClassificationSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultSettings: ClassificationSettings = {
      diasFalla: 20,
      diasExceso: 60,
      diasOK: { min: 20, max: 60 }
    };
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="bg-gray-900 border border-blue-500/30 rounded-xl shadow-sm p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <span className="font-medium text-gray-100">Configuración de Clasificación</span>
        </div>
        <div className="text-xs text-gray-400">
          Falla: {settings.diasFalla}d | Exceso: {settings.diasExceso}d
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Días para Falla
              </label>
              <input
                type="number"
                value={localSettings.diasFalla}
                onChange={(e) => setLocalSettings({ 
                  ...localSettings, 
                  diasFalla: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Productos con menos días de inventario
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Días para Exceso
              </label>
              <input
                type="number"
                value={localSettings.diasExceso}
                onChange={(e) => setLocalSettings({ 
                  ...localSettings, 
                  diasExceso: parseInt(e.target.value) || 0 
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Productos con más días de inventario
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rango OK
              </label>
              <div className="text-sm text-gray-400 p-2 bg-gray-700 rounded-lg">
                Entre {localSettings.diasFalla} y {localSettings.diasExceso} días
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculado automáticamente
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restaurar</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              <Save className="h-4 w-4" />
              <span>Aplicar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassificationSettingsComponent;