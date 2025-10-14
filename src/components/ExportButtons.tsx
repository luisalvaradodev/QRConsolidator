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
 * 1. Hoja 'Consolidado': Contiene todos los datos sin consolidar, como una lista completa.
 * 2. Hojas por Farmacia: Contienen los datos sin consolidar, específicos de cada farmacia.
 * Se incluyen las nuevas columnas: sugerido30d, sugerido50d, promedio40d, promedio50d y cantidad.
 * La columna 'Farmacia' ahora se coloca al final.
 */
const exportToExcel = (_consolidatedData: ConsolidatedInventoryItem[], rawData: InventoryItem[], filename: string) => {
  // Hoja 1: Datos no consolidados (todos los productos por farmacia, en una lista)
  const allDataForExport = rawData.map(item => ({
    'Código': item.codigo,
    'Nombre del producto': item.nombre,
    'Marca': item.marca,
    'Departamento': item.departamento,
    'Farmacia': item.farmacia, // <-- Columna movida aquí
    'Existencia Actual': item.existenciaActual,
    'Cant. Vendida 60 días': item.cantidad,
    'Clasificación': item.clasificacion,
    'Sugerido 30 días': item.sugerido30d,
    'Sugerido 40 días': item.sugerido40d,
    'Sugerido 50 días': item.sugerido50d,
    'Sugerido 60 días': item.sugerido60d,
    // Se redondea hacia el entero superior
    'Promedio Ventas 30 días': Math.ceil(item.promedio30d),
    'Promedio Ventas 40 días': Math.ceil(item.promedio40d),
    'Promedio Ventas 50 días': Math.ceil(item.promedio50d),
    'Promedio Ventas 60 días': Math.ceil(item.promedio60d),
  }));

  // Hojas 2+: Datos por farmacia
  const farmaciaGroups = rawData.reduce((groups, item) => {
    if (!groups[item.farmacia]) {
      groups[item.farmacia] = [];
    }
    groups[item.farmacia].push({
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Farmacia': item.farmacia, // <-- Columna movida aquí
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      'Sugerido 30 días': item.sugerido30d,
      'Sugerido 40 días': item.sugerido40d,
      'Sugerido 50 días': item.sugerido50d,
      'Sugerido 60 días': item.sugerido60d,
      // Se redondea hacia el entero superior
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
        {rawData.length.toLocaleString()} productos totales.
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