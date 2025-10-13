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

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, iconColor }) => (
  <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center gap-3 flex-1 min-w-[140px]">
    <Icon className={`h-5 w-5 ${iconColor}`} />
    <div>
      <p className="text-xs text-gray-400 font-medium truncate">{title}</p>
      <p className="text-lg font-bold text-gray-100">{value.toLocaleString()}</p>
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
    <div className="flex flex-wrap gap-2">
      <MetricCard title="Total Productos" value={metrics.totalProductos} icon={List} iconColor="text-blue-400" />
      <MetricCard title="Stock Total" value={metrics.totalExistencia} icon={Package} iconColor="text-green-400" />
      <MetricCard title="Fallas" value={metrics.productosEnFalla} icon={AlertCircle} iconColor="text-red-400" />
      <MetricCard title="Excesos" value={metrics.productosEnExceso} icon={TrendingDown} iconColor="text-yellow-400" />
      <MetricCard title="No Vendidos" value={metrics.productosNoVendidos} icon={PackageX} iconColor="text-gray-400" />
    </div>
  );
};

export default MetricsDashboard;