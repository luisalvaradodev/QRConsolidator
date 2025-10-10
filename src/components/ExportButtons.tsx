import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { exportToCSV, exportToExcel } from '../utils/fileProcessor';

interface ExportButtonsProps {
  data: InventoryItem[];
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data }) => {
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventario_consolidado_${timestamp}.csv`;
    exportToCSV(data, filename);
  };

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventario_consolidado_${timestamp}.xlsx`;
    exportToExcel(data, filename);
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
        Los archivos incluirán todos los datos visibles con los filtros aplicados
      </p>
    </div>
  );
};

export default ExportButtons;