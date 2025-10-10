import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
// --- IMPORTAR EL NUEVO TIPO ---
import { ConsolidatedInventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  // --- CAMBIO CLAVE: Usar ConsolidatedInventoryItem[] ---
  data: ConsolidatedInventoryItem[];
}

// --- LÓGICA DE EXPORTACIÓN ACTUALIZADA ---
const exportToCSV = (data: ConsolidatedInventoryItem[], filename: string) => {
  const headers = [
    'Código', 'Nombre(s)', 'Stock Total', 'Venta Diaria Prom.', 'Clasificación', 
    'Sugerido 40d', 'Sugerido 45d', 'Sugerido 50d', 'Sugerido 60d',
    'Departamento(s)', 'Marca(s)', 'Farmacia(s)'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${item.codigo}"`,
      `"${item.nombres.join(', ')}"`,
      item.existenciaActual,
      item.promedioDiario,
      `"${item.clasificacion}"`,
      item.sugerido40d,
      item.sugerido45d,
      item.sugerido50d,
      item.sugerido60d,
      `"${item.departamentos.join(', ')}"`,
      `"${item.marcas.join(', ')}"`,
      `"${item.farmacias.join(', ')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = (data: ConsolidatedInventoryItem[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'Código': item.codigo,
    'Nombre(s)': item.nombres.join(', '),
    'Stock Total': item.existenciaActual,
    'Venta Diaria Prom.': item.promedioDiario,
    'Clasificación': item.clasificacion,
    'Sugerido 40d': item.sugerido40d,
    'Sugerido 45d': item.sugerido45d,
    'Sugerido 50d': item.sugerido50d,
    'Sugerido 60d': item.sugerido60d,
    'Departamento(s)': item.departamentos.join(', '),
    'Marca(s)': item.marcas.join(', '),
    'Farmacia(s)': item.farmacias.join(', '),
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Consolidado');
  XLSX.writeFile(workbook, filename);
};


const ExportButtons: React.FC<ExportButtonsProps> = ({ data }) => {
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(data, `inventario_consolidado_${timestamp}.csv`);
  };

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(data, `inventario_consolidado_${timestamp}.xlsx`);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Download className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-800">Exportar Datos</h3>
        </div>
        <p className="text-gray-500 text-center py-4">
          No hay datos para exportar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Download className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Exportar Datos</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Exportar {data.length.toLocaleString()} productos filtrados
      </p>
      
      <div className="space-y-3">
        <button
          onClick={handleExportCSV}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Exportar a CSV</span>
        </button>
        
        <button
          onClick={handleExportExcel}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar a Excel</span>
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        Los archivos incluirán los datos con los filtros aplicados.
      </p>
    </div>
  );
};

export default ExportButtons;