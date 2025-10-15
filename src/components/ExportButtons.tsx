import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { InventoryItem, ClassificationSettings } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  rawData: InventoryItem[];
  settings: ClassificationSettings;
}

const exportToExcel = (rawData: InventoryItem[], settings: ClassificationSettings, filename: string) => {
  const mapItemToRow = (item: InventoryItem) => {
    const sugeridoColumns: { [key: string]: any } = {};
    const promedioColumns: { [key: string]: any } = {};

    const sortedPeriodos = [...settings.periodos].sort((a, b) => a - b);

    sortedPeriodos.forEach(p => {
      sugeridoColumns[`Sugerido ${p}d`] = item[`sugerido${p}d`] || 0;
    });

    sortedPeriodos.forEach(p => {
      promedioColumns[`Prom. ${p}d`] = Math.ceil(item[`promedio${p}d`] || 0);
    });

    return {
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Farmacia': item.farmacia,
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      'Exceso': item.excesoUnidades,
      ...sugeridoColumns,
      ...promedioColumns,
      'Moneda factor de cambio': item.monedaFactorCambio,
      'Costo Unitario': item.costoUnitario,
      '%Util.': item.utilidad,
      'Precio máximo': item.precioMaximo,
    };
  };

  const allDataForExport = rawData.map(mapItemToRow);

  const farmaciaGroups = rawData.reduce((groups, item) => {
    const farmacia = item.farmacia || 'Sin Farmacia';
    if (!groups[farmacia]) {
      groups[farmacia] = [];
    }
    groups[farmacia].push(mapItemToRow(item));
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

const ExportButtons: React.FC<ExportButtonsProps> = ({ rawData, settings }) => {
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(rawData, settings, `inventario_consolidado_${timestamp}.xlsx`);
  };

  if (rawData.length === 0) {
    return (
      <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 text-center">
        <Download className="h-5 w-5 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Exportar</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">No hay datos</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
      <button
        onClick={handleExportExcel}
        className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Exportar a Excel</span>
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        {rawData.length.toLocaleString()} productos
      </p>
    </div>
  );
};

export default ExportButtons;