import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ConsolidatedInventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  data: ConsolidatedInventoryItem[];
  // Prop adicional para recibir los días de sugerencia actuales de la tabla
  suggestionDays: number[]; 
}

// Función auxiliar para calcular sugerencias, igual que en DataTable
const calculateSuggestion = (item: ConsolidatedInventoryItem, days: number): number => {
  return Math.max(0, Math.round(item.promedioDiario * days) - item.existenciaActual);
};

const exportToExcel = (data: ConsolidatedInventoryItem[], suggestionDays: number[], filename: string) => {
  // Crear el cuerpo de datos para el Excel
  const dataForExport = data.map(item => {
    const row: any = {
      'Código': item.codigo,
      'Nombre(s)': item.nombres.join(', '),
      'Stock Real': item.existenciaActual,
      'Stock Sistema': item.cantidad,
      'Venta Diaria Prom.': item.promedioDiario,
      'Clasificación': item.clasificacion,
    };

    // Añadir las columnas de sugerencia dinámicamente
    suggestionDays.forEach(days => {
      row[`Sugerido ${days}d`] = calculateSuggestion(item, days);
    });

    row['Departamento(s)'] = item.departamentos.join(', ');
    row['Marca(s)'] = item.marcas.join(', ');
    row['Farmacia(s)'] = item.farmacias.join(', ');
    
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataForExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Consolidado');
  XLSX.writeFile(workbook, filename);
};


const ExportButtons: React.FC<ExportButtonsProps> = ({ data, suggestionDays }) => {

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(data, suggestionDays, `inventario_consolidado_${timestamp}.xlsx`);
  };
  
  // La exportación a CSV es similar pero se omite por simplicidad, Excel es más robusto.
  // Si la necesitas, se puede implementar siguiendo el mismo patrón que exportToExcel.

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
          onClick={handleExportExcel}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar a Excel</span>
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        El archivo incluirá los filtros y los días de sugerencia actuales.
      </p>
    </div>
  );
};

export default ExportButtons;