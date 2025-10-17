import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { InventoryItem, ClassificationSettings } from '../types/inventory';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExportButtonsProps {
  rawData: InventoryItem[];
  settings: ClassificationSettings;
}

const exportToExcel = async (rawData: InventoryItem[], settings: ClassificationSettings, filename: string) => {
  const workbook = new ExcelJS.Workbook();

  // Esta función está perfecta, no necesita cambios.
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

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FF000000' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    },
  };

  const addSheetWithStyles = (sheetName: string, data: any[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const headerRow = sheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // --- INICIO DE LA CORRECCIÓN ---
    // En lugar de usar Object.values(), mapeamos los datos en el orden exacto de los encabezados.
    // Esto garantiza que cada valor caiga en la columna correcta.
    const rows = data.map(item => {
      return headers.map(header => item[header]);
    });
    sheet.addRows(rows);
    // --- FIN DE LA CORRECCIÓN ---
  };

  addSheetWithStyles('Consolidado', allDataForExport);

  const farmaciaGroups = rawData.reduce((groups, item) => {
    const farmacia = item.farmacia || 'Sin Farmacia';
    if (!groups[farmacia]) {
      groups[farmacia] = [];
    }
    groups[farmacia].push(mapItemToRow(item));
    return groups;
  }, {} as { [key: string]: any[] });

  Object.entries(farmaciaGroups).forEach(([farmacia, data]) => {
    addSheetWithStyles(farmacia, data);
  });
  
  const createEmptySheetWithHeaders = (sheetName: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.style = headerStyle;
    });
  };

  createEmptySheetWithHeaders('Compras', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'DE', 'PARA']);
  createEmptySheetWithHeaders('Movimientos', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'FA', 'Q1', 'Q2', 'NENA', 'Zakipharma', 'VitalClinic']);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
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
