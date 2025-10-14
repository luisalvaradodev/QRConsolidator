import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { ConsolidatedInventoryItem, InventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  data: ConsolidatedInventoryItem[];
  rawData: InventoryItem[];
}

// La lógica de exportación no cambia
const exportToExcel = (_consolidatedData: ConsolidatedInventoryItem[], rawData: InventoryItem[], filename: string) => {
  const allDataForExport = rawData.map(item => ({
    'Código': item.codigo,
    'Nombre del producto': item.nombre,
    'Marca': item.marca,
    'Departamento': item.departamento,
    'Farmacia': item.farmacia,
    'Existencia Actual': item.existenciaActual,
    'Cant. Vendida 60 días': item.cantidad,
    'Clasificación': item.clasificacion,
    'Sugerido 30 días': item.sugerido30d,
    'Sugerido 40 días': item.sugerido40d,
    'Sugerido 50 días': item.sugerido50d,
    'Sugerido 60 días': item.sugerido60d,
    'Promedio Ventas 30 días': Math.ceil(item.promedio30d),
    'Promedio Ventas 40 días': Math.ceil(item.promedio40d),
    'Promedio Ventas 50 días': Math.ceil(item.promedio50d),
    'Promedio Ventas 60 días': Math.ceil(item.promedio60d),
  }));

  const farmaciaGroups = rawData.reduce((groups, item) => {
    if (!groups[item.farmacia]) {
      groups[item.farmacia] = [];
    }
    groups[item.farmacia].push({
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Farmacia': item.farmacia,
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      'Sugerido 30 días': item.sugerido30d,
      'Sugerido 40 días': item.sugerido40d,
      'Sugerido 50 días': item.sugerido50d,
      'Sugerido 60 días': item.sugerido60d,
      'Promedio Ventas 30 días': Math.ceil(item.promedio30d),
      'Promedio Ventas 40 días': Math.ceil(item.promedio40d),
      'Promedio Ventas 50 días': Math.ceil(item.promedio50d),
      'Promedio Ventas 60 días': Math.ceil(item.promedio60d),
    });
    return groups;
  }, {} as { [key: string]: any[] });

  const workbook = XLSX.utils.book_new();
  const consolidatedSheet = XLSX.utils.json_to_sheet(allDataForExport);
  XLSX.utils.book_append_sheet(workbook, consolidatedSheet, 'Consolidado');

  Object.entries(farmaciaGroups).forEach(([farmacia, data]) => {
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, farmacia);
  });

  XLSX.writeFile(workbook, filename);
};

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, rawData }) => {
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(data, rawData, `inventario_consolidado_${timestamp}.xlsx`);
  };

  // Vista compacta para cuando no hay datos
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-500/30 rounded-xl p-3 text-center">
        <Download className="h-5 w-5 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Exportar</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">No hay datos</p>
      </div>
    );
  }

  // Vista principal compacta
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-500/30 rounded-xl p-3">
      <button
        onClick={handleExportExcel}
        className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-900 focus:ring-green-500"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Exportar a Excel</span>
      </button>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
        {rawData.length.toLocaleString()} productos en total.
      </p>
    </div>
  );
};

export default ExportButtons;