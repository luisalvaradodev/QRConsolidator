import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { ConsolidatedInventoryItem, InventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  data: ConsolidatedInventoryItem[];
  rawData: InventoryItem[];
}

/**
 * Función que genera un archivo Excel con múltiples hojas:
 * 1. Hoja 'Consolidado': Contiene los datos agrupados por producto, incluyendo existencias por farmacia.
 * 2. Hojas por Farmacia: Contienen los datos sin consolidar, específicos de cada farmacia.
 * Se incluyen las nuevas columnas: sugerido30d, sugerido50d, promedio40d, promedio50d y cantidad.
 */
const exportToExcel = (consolidatedData: ConsolidatedInventoryItem[], rawData: InventoryItem[], filename: string) => {
  // Hoja 1: Datos consolidados (alineados con las columnas de DataTable)
  const consolidatedForExport = consolidatedData.map(item => ({
    'Código': item.codigo,
    'Nombre del producto': item.nombres.join(', '),
    'Marca': item.marcas.join(', '),
    'Departamento': item.departamentos.join(', '),
    'Existencia Actual': item.existenciaActual,
    // Nueva columna: Cantidad vendida en 60 días
    'Cantidad Vendida 60 días': item.cantidad,
    'Farmacia': item.farmacias.join(', '),
    'Clasificación': item.clasificacion,
    // Nuevas columnas de sugeridos
    'Sugerido 30 días': item.sugerido30d,
    'Sugerido 40 días': item.sugerido40d,
    'Sugerido 50 días': item.sugerido50d,
    'Sugerido 60 días': item.sugerido60d,
    // Nuevas columnas de promedios
    'Promedio Ventas 30 días': item.promedio30d.toFixed(2),
    'Promedio Ventas 40 días': item.promedio40d.toFixed(2),
    'Promedio Ventas 50 días': item.promedio50d.toFixed(2),
    'Promedio Ventas 60 días': item.promedio60d.toFixed(2),
    ...Object.keys(item.existenciasPorFarmacia).reduce((acc, farmacia) => {
      acc[`Existencia ${farmacia}`] = item.existenciasPorFarmacia[farmacia];
      return acc;
    }, {} as { [key: string]: number })
  }));

  // Hojas 2+: Datos por farmacia (asume que InventoryItem incluye los campos sugeridos y promedios)
  const farmaciaGroups = rawData.reduce((groups, item) => {
    if (!groups[item.farmacia]) {
      groups[item.farmacia] = [];
    }
    groups[item.farmacia].push({
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Existencia Actual': item.existenciaActual,
      // Nueva columna: Cantidad vendida en 60 días
      'Cantidad Vendida 60 días': item.cantidad,
      'Farmacia': item.farmacia,
      'Clasificación': item.clasificacion,
      // Nuevas columnas de sugeridos
      'Sugerido 30 días': item.sugerido30d,
      'Sugerido 40 días': item.sugerido40d,
      'Sugerido 50 días': item.sugerido50d,
      'Sugerido 60 días': item.sugerido60d,
      // Nuevas columnas de promedios
      'Promedio Ventas 30 días': item.promedio30d.toFixed(2),
      'Promedio Ventas 40 días': item.promedio40d.toFixed(2),
      'Promedio Ventas 50 días': item.promedio50d.toFixed(2),
      'Promedio Ventas 60 días': item.promedio60d.toFixed(2),
    });
    return groups;
  }, {} as { [key: string]: any[] });

  const workbook = XLSX.utils.book_new();
  
  // Agregar hoja consolidada
  const consolidatedSheet = XLSX.utils.json_to_sheet(consolidatedForExport);
  XLSX.utils.book_append_sheet(workbook, consolidatedSheet, 'Consolidado');
  
  // Agregar hojas por farmacia
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

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Download className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-gray-100">Exportar</h3>
        </div>
        <p className="text-gray-400 text-center py-4">No hay datos para exportar</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Download className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-gray-100">Exportar</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {data.length.toLocaleString()} productos consolidados.
      </p>
      <div className="space-y-3">
        <button
          onClick={handleExportExcel}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar Excel</span>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Incluye consolidado y datos por farmacia
      </p>
    </div>
  );
};

export default ExportButtons;
