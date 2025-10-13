// src/components/MetricsDashboard.tsx

import React, { useMemo } from 'react';
import { Package, AlertCircle, TrendingDown, PackageX, List } from 'lucide-react';
import { ConsolidatedInventoryItem } from '../types/inventory';

interface MetricsDashboardProps {
  data: ConsolidatedInventoryItem[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
}

// Componente de tarjeta modificado para ser más compacto
const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, iconColor }) => (
  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-1 min-w-[160px] transition-colors duration-300">
    <Icon className={`h-6 w-6 ${iconColor}`} />
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
    </div>
  </div>
);

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalProductos: 0,
        totalExistencia: 0,
        productosEnFalla: 0,
        productosEnExceso: 0,
        productosNoVendidos: 0,
      };
    }

    return {
      totalProductos: data.length,
      totalExistencia: data.reduce((sum, item) => sum + item.existenciaActual, 0),
      productosEnFalla: data.filter(item => item.clasificacion === 'Falla').length,
      productosEnExceso: data.filter(item => item.clasificacion === 'Exceso').length,
      productosNoVendidos: data.filter(item => item.clasificacion === 'No vendido').length,
    };
  }, [data]);

  return (
    // Contenedor modificado para un mejor ajuste, sin título h2
    <div className="flex flex-wrap gap-3">
      <MetricCard title="Total Productos" value={metrics.totalProductos} icon={List} iconColor="text-blue-500" />
      <MetricCard title="Unidades en Stock" value={metrics.totalExistencia} icon={Package} iconColor="text-green-500" />
      <MetricCard title="Productos en Falla" value={metrics.productosEnFalla} icon={AlertCircle} iconColor="text-red-500" />
      <MetricCard title="Prods. en Exceso" value={metrics.productosEnExceso} icon={TrendingDown} iconColor="text-yellow-500" />
      <MetricCard title="Prods. No Vendidos" value={metrics.productosNoVendidos} icon={PackageX} iconColor="text-gray-500" />
    </div>
  );
};

export default MetricsDashboard;