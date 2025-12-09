import React, { useMemo } from 'react';

// --- TIPOS ---
// Definidos aquí para que el archivo sea autónomo.
// Si ya tienes el archivo '../types/inventory', puedes descomentar la importación y borrar esto.
export interface ConsolidatedInventoryItem {
  id: string;
  nombre: string;
  existenciaActual: number;
  clasificacion: 'Falla' | 'Exceso' | 'No vendido' | 'OK';
}

interface MetricsDashboardProps {
  data: ConsolidatedInventoryItem[];
}

interface MetricItemProps {
  title: string;
  value: number;
  colorClass: string;
}

// --- SUB-COMPONENTE PARA CADA ITEM ---
const MetricItem: React.FC<MetricItemProps> = ({ title, value, colorClass }) => (
  <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-200 dark:border-slate-700 last:border-r-0 shrink-0">
    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
      {title}
    </span>
    <span className={`text-sm font-mono font-bold tabular-nums ${colorClass}`}>
      {value.toLocaleString()}
    </span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    return {
      total: data.length,
      stock: data.reduce((sum, item) => sum + item.existenciaActual, 0),
      falla: data.filter(item => item.clasificacion === 'Falla').length,
      exceso: data.filter(item => item.clasificacion === 'Exceso').length,
      sinVenta: data.filter(item => item.clasificacion === 'No vendido').length,
      ok: data.filter(item => item.clasificacion === 'OK').length,
    };
  }, [data]);

  if (!metrics) return null;

  return (
    <div className="flex flex-wrap items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto scrollbar-thin py-2 px-1">
      
      {/* Total General */}
      <MetricItem 
        title="Total Items" 
        value={metrics.total} 
        colorClass="text-slate-900 dark:text-slate-100" 
      />
      
      {/* Stock Total */}
      <MetricItem 
        title="Stock Global" 
        value={metrics.stock} 
        colorClass="text-blue-600 dark:text-blue-400" 
      />

      {/* Separador Visual (Visible solo en pantallas medianas+) */}
      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

      {/* Métricas por Clasificación */}
      <MetricItem 
        title="Fallas" 
        value={metrics.falla} 
        colorClass="text-red-600 dark:text-red-400" 
      />
      
      <MetricItem 
        title="Excesos" 
        value={metrics.exceso} 
        colorClass="text-yellow-600 dark:text-yellow-400" 
      />
      
      <MetricItem 
        title="Sin Venta" 
        value={metrics.sinVenta} 
        colorClass="text-slate-500 dark:text-slate-400" 
      />
      
      <MetricItem 
        title="Óptimos" 
        value={metrics.ok} 
        colorClass="text-emerald-600 dark:text-emerald-400" 
      />
    </div>
  );
};

export default MetricsDashboard;