import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { ConsolidatedInventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  data: ConsolidatedInventoryItem[];
}

const exportToExcel = (data: ConsolidatedInventoryItem[], filename: string) => {
  // Mapear los datos a la estructura de columnas exacta que especificaste
  const dataForExport = data.map(item => ({
    'Código': item.codigo,
    'Nombre': item.nombres.join(', '),
    'Existencia Actual': item.existenciaActual,
    'Departamento': item.departamentos.join(', '),
    'Marca': item.marcas.join(', '),
    'Cantidad': item.cantidad,
    'Promedio Diario': item.promedioDiario.toFixed(2),
    'Clasificación': item.clasificacion,
    'Sugerido 40d': item.sugerido40d,
    'Sugerido 45d': item.sugerido45d,
    'Sugerido 50d': item.sugerido50d,
    'Sugerido 60d': item.sugerido60d,
    'Exceso Unidades': item.excesoUnidades,
    'Farmacia': item.farmacias.join(', '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado');
  XLSX.writeFile(workbook, filename);
};

const ExportButtons: React.FC<ExportButtonsProps> = ({ data }) => {
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(data, `inventario_consolidado_${timestamp}.xlsx`);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4"><Download className="h-5 w-5 text-gray-400" /><h3 className="font-semibold text-gray-800">Exportar Consolidado</h3></div>
        <p className="text-gray-500 text-center py-4">No hay datos para exportar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4"><Download className="h-5 w-5 text-gray-600" /><h3 className="font-semibold text-gray-800">Exportar Consolidado</h3></div>
      <p className="text-sm text-gray-600 mb-4">Exportar {data.length.toLocaleString()} productos consolidados</p>
      <div className="space-y-3">
        <button
          onClick={handleExportExcel}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar a Excel</span>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">El archivo incluirá todos los productos con los filtros aplicados.</p>
    </div>
  );
};

export default ExportButtons;