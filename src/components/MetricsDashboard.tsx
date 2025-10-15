import React, { useMemo } from 'react';
import { Package, AlertCircle, TrendingDown, PackageX, List, CheckCircle } from 'lucide-react';

// --- TIPOS (ajusta según la estructura de tus datos) ---
export interface ConsolidatedInventoryItem {
  id: string;
  nombre: string;
  existenciaActual: number;
  clasificacion: 'Falla' | 'Exceso' | 'No vendido' | 'OK';
}

interface MetricsDashboardProps {
  data: ConsolidatedInventoryItem[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

// --- FUNCIÓN AUXILIAR (sin cambios) ---
const formatCompactNumber = (num: number): string => {
  if (num === null || num === undefined) return '0';
  if (Math.abs(num) < 1000) return num.toLocaleString();

  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (tier === 0) return num.toLocaleString();
  
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  return scaled.toFixed(1).replace(/\.0$/, '') + suffix;
};

// --- COMPONENTE MetricCard: VERSIÓN ALINEADA ---
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  bgColor, 
}) => {
  const displayValue = typeof value === 'number' ? formatCompactNumber(value) : value;

  return (
    <div 
      className={`
        ${bgColor} border border-slate-200 dark:border-slate-700
        p-1.5 rounded-md flex flex-col justify-center items-center text-center
      `}
    >
      <Icon className={`${iconColor} h-4 w-4 mb-0.5 flex-shrink-0`} />
      
      <div className="flex flex-col">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
          {title}
        </p>
        {/* LA CLAVE: font-mono alinea los números perfectamente */}
        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
          {displayValue}
        </p>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---
const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalProductos: 0,
        totalExistencia: 0,
        productosEnFalla: 0,
        productosEnExceso: 0,
        productosNoVendidos: 0,
        productosOK: 0,
      };
    }
    return {
      totalProductos: data.length,
      totalExistencia: data.reduce((sum, item) => sum + item.existenciaActual, 0),
      productosEnFalla: data.filter(item => item.clasificacion === 'Falla').length,
      productosEnExceso: data.filter(item => item.clasificacion === 'Exceso').length,
      productosNoVendidos: data.filter(item => item.clasificacion === 'No vendido').length,
      productosOK: data.filter(item => item.clasificacion === 'OK').length,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
      {/* Títulos Abreviados */}
      <MetricCard 
        title="Total" 
        value={metrics.totalProductos} 
        icon={List} 
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-900/50"
      />
      <MetricCard 
        title="Stock" 
        value={metrics.totalExistencia} 
        icon={Package} 
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-50 dark:bg-green-900/50"
      />
      <MetricCard 
        title="Fallas" 
        value={metrics.productosEnFalla} 
        icon={AlertCircle} 
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-50 dark:bg-red-900/50"
      />
      <MetricCard 
        title="Exceso" 
        value={metrics.productosEnExceso} 
        icon={TrendingDown} 
        iconColor="text-yellow-600 dark:text-yellow-400"
        bgColor="bg-yellow-50 dark:bg-yellow-900/50"
      />
      <MetricCard 
        title="S/Venta" 
        value={metrics.productosNoVendidos} 
        icon={PackageX} 
        iconColor="text-slate-600 dark:text-slate-400"
        bgColor="bg-slate-100 dark:bg-slate-800/50"
      />
      <MetricCard 
        title="OK" 
        value={metrics.productosOK} 
        icon={CheckCircle}
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-900/50"
      />
    </div>
  );
};

export default MetricsDashboard;