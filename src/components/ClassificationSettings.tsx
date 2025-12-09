import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Plus, X, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { ClassificationSettings } from '../types/inventory';

interface ClassificationSettingsProps {
  settings: ClassificationSettings;
  onSettingsChange: (settings: ClassificationSettings) => void;
}

// Estilos para ocultar flechas de input number (Chrome/Safari/Edge/Firefox)
const NO_SPINNER_CLASS = "[&::-webkit-inner-spin-button]:appearance-none hover:[&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";

const PropertyInput = ({ label, value, onChange, suffix }: { label: string, value: any, onChange: (e: any) => void, suffix?: string }) => (
  <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700 last:border-b-0 group">
    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
      {label}
    </label>
    <div className="flex items-center justify-end relative w-20">
      <input
        type="number"
        value={value}
        onChange={onChange}
        className={`w-full text-right bg-transparent text-xs font-mono font-medium text-slate-800 dark:text-slate-200 border-none p-0 pr-0.5 focus:ring-0 focus:outline-none ${NO_SPINNER_CLASS}`}
      />
      {suffix && <span className="text-[10px] text-slate-400 ml-0.5 select-none">{suffix}</span>}
      {/* Línea de foco animada */}
      <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-blue-500 transform scale-x-0 group-focus-within:scale-x-100 transition-transform origin-right"></div>
    </div>
  </div>
);

const ClassificationSettingsComponent: React.FC<ClassificationSettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<ClassificationSettings>(settings);

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const hasChanges = useMemo(() => JSON.stringify(localSettings) !== JSON.stringify(settings), [localSettings, settings]);

  const handleSave = () => {
    if (localSettings.diasFalla >= localSettings.diasExceso) { alert('Falla < Exceso requerido.'); return; }
    onSettingsChange({ ...localSettings, diasOK: { min: localSettings.diasFalla, max: localSettings.diasExceso } });
  };

  const handleReset = () => {
    setLocalSettings({ diasFalla: 20, diasExceso: 60, diasOK: { min: 20, max: 60 }, periodos: [30, 40, 50, 60] });
  };

  const handlePeriodoChange = (index: number, val: string) => {
    const newP = [...localSettings.periodos]; newP[index] = parseInt(val, 10) || 0;
    setLocalSettings({ ...localSettings, periodos: newP });
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm text-xs">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-50 dark:bg-slate-900 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <SlidersHorizontal size={14} /> Configuración
        </h3>
        {hasChanges && <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">SIN GUARDAR</span>}
      </div>

      <div className="p-3 space-y-4">
        
        {/* --- SECCIÓN 1: UMBRALES --- */}
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 pl-1">Umbrales de Stock</h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded px-3 bg-slate-50/50 dark:bg-slate-900/50">
            <PropertyInput label="Días Falla" value={localSettings.diasFalla} onChange={(e) => setLocalSettings({ ...localSettings, diasFalla: parseInt(e.target.value)||0 })} suffix="d" />
            <PropertyInput label="Días Exceso" value={localSettings.diasExceso} onChange={(e) => setLocalSettings({ ...localSettings, diasExceso: parseInt(e.target.value)||0 })} suffix="d" />
          </div>
          
          {/* Barra Visual Mini */}
          <div className="mt-2 flex h-4 rounded overflow-hidden text-[8px] font-bold uppercase leading-none text-center border border-slate-200 dark:border-slate-800 opacity-90">
            <div className="bg-red-100 text-red-800 flex items-center justify-center truncate" style={{ width: '30%' }}>&lt;{localSettings.diasFalla}</div>
            <div className="bg-emerald-100 text-emerald-800 flex items-center justify-center border-x border-white/50" style={{ width: '40%' }}>OK</div>
            <div className="bg-amber-100 text-amber-800 flex items-center justify-center truncate" style={{ width: '30%' }}>&gt;{localSettings.diasExceso}</div>
          </div>
        </div>

        {/* Separador visual sutil */}
        <hr className="border-slate-100 dark:border-slate-800" />

        {/* --- SECCIÓN 2: PERÍODOS DE ANÁLISIS --- */}
        <div>
          <div className="flex justify-between items-center mb-2 pl-1">
             <h4 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
               <CalendarDays size={12} className="opacity-70"/> Períodos de Análisis
             </h4>
             <button onClick={() => setLocalSettings({ ...localSettings, periodos: [...localSettings.periodos, 0] })} 
               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1">
               <Plus size={10}/> AÑADIR
             </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {localSettings.periodos.map((p, idx) => (
              <div key={idx} className="relative group">
                <input 
                  type="number" 
                  value={p} 
                  onChange={(e) => handlePeriodoChange(idx, e.target.value)}
                  className={`w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-medium py-1 px-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${NO_SPINNER_CLASS}`} 
                  placeholder="0"
                />
                {/* Botón X superpuesto */}
                <button 
                  onClick={() => setLocalSettings({...localSettings, periodos: localSettings.periodos.filter((_, i) => i !== idx)})}
                  className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- FOOTER --- */}
      <div className="bg-slate-50 dark:bg-slate-900 px-3 py-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
        <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Restaurar Defecto">
            <RotateCcw size={14} />
        </button>
        <button onClick={handleSave} disabled={!hasChanges}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wide rounded-[3px] transition-all 
          ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}>
          <Save size={14} /> Aplicar
        </button>
      </div>
    </div>
  );
};

export default ClassificationSettingsComponent;