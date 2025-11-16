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

  // Función para redondear un número a dos decimales
  const roundToTwoDecimals = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.round(value * 100) / 100;
  };

  // Función para reemplazar Farmanaco por FA en cualquier campo
  const replaceFarmanaco = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/Farmanaco/g, 'FA');
    }
    return value;
  };

  // Esta función mapea el item de inventario a una fila para Excel
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

    // Aplicar reemplazo de Farmanaco por FA en todos los campos relevantes
    const farmacia = replaceFarmanaco(item.farmacia) || 'Sin Farmacia';
    const nombre = replaceFarmanaco(item.nombre);
    const marca = replaceFarmanaco(item.marca);
    const departamento = replaceFarmanaco(item.departamento);

    return {
      'Código': item.codigo,
      'Nombre del producto': nombre,
      'Marca': marca,
      'Departamento': departamento,
      'Farmacia': farmacia,
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      'Exceso': item.excesoUnidades,
      ...sugeridoColumns,
      ...promedioColumns,
      'Moneda factor de cambio': item.monedaFactorCambio,
      'Costo Unitario': item.costoUnitario,
      // APLICACIÓN DEL REDONDEO: Redondeamos la utilidad a un máximo de 2 decimales.
      '%Util.': roundToTwoDecimals(item.utilidad),
      'Precio máximo': item.precioMaximo,
    };
  };

  const allDataForExport = rawData.map(mapItemToRow);

  // Estilo de encabezado amarillo (el que ya tenías)
  const yellowHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FF000000' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }, // Amarillo
    },
  };

  const applySheetSettings = (sheet: ExcelJS.Worksheet, headers: string[]) => {
    // Congelar la primera fila (inmovilización)
    sheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
        xSplit: 0,
        activeCell: 'A2',
        showGridLines: true
      }
    ];

    // Aplicar filtros a todas las columnas
    if (headers.length > 0) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };
    }

    // Configurar formato de número fracción para la columna "Código"
    const codigoIndex = headers.findIndex(header => header.toUpperCase() === 'CÓDIGO'); // Buscamos en mayúsculas por si acaso
    if (codigoIndex !== -1) {
      const codigoColumn = sheet.getColumn(codigoIndex + 1);
      codigoColumn.numFmt = '# ?/?'; // Formato de fracción
    }
  };

  /**
   * Esta función añade una hoja de cálculo con datos (Consolidado y Farmacias)
   * REGLA: Solo los primeros 5 encabezados van en mayúsculas.
   */
  const addSheetWithStyles = (sheetName: string, data: any[]) => {
    // Aplicar reemplazo de Farmanaco en el nombre de la hoja también
    const processedSheetName = replaceFarmanaco(sheetName);
    const sheet = workbook.addWorksheet(processedSheetName);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    // REGLA "CONSOLIDADO": Solo los primeros 5 encabezados en mayúsculas
    const processedHeaders = headers.map((header, index) => {
      return index < 5 ? header.toUpperCase() : header;
    });

    const headerRow = sheet.addRow(processedHeaders);

    headerRow.eachCell((cell) => {
      cell.style = yellowHeaderStyle; // Aplicamos el estilo amarillo
    });

    const rows = data.map(item => {
      return headers.map(header => item[header]);
    });
    sheet.addRows(rows);

    // Aplicar configuraciones a la hoja (filtros, freeze, formato código)
    // Usamos processedHeaders para que el applySheetSettings funcione correctamente
    applySheetSettings(sheet, processedHeaders);
  };

  // --- Creación de hojas de datos ---
  
  // 1. Hoja "Consolidado" (usa addSheetWithStyles)
  addSheetWithStyles('Consolidado', allDataForExport);

  // 2. Hojas por Farmacia (usa addSheetWithStyles)
  const farmaciaGroups = rawData.reduce((groups, item) => {
    let farmacia = replaceFarmanaco(item.farmacia) || 'Sin Farmacia';
    
    if (!groups[farmacia]) {
      groups[farmacia] = [];
    }
    
    // Usar el item ya mapeado que incluye el reemplazo de Farmanaco
    const mappedItem = mapItemToRow(item);
    groups[farmacia].push(mappedItem);
    
    return groups;
  }, {} as { [key: string]: any[] });

  Object.entries(farmaciaGroups).forEach(([farmacia, data]) => {
    // Reemplazamos caracteres inválidos para el nombre de la hoja
    const validFarmaciaName = farmacia.replace(/[/\\?*[\]]/g, ' ').substring(0, 31);
    addSheetWithStyles(validFarmaciaName, data);
  });
  
  
  /**
   * Esta función crea una hoja vacía con encabezados (Compras, Movimientos)
   * REGLA: Todos los encabezados van en mayúsculas.
   */
  const createEmptySheetWithHeaders = (sheetName: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    
    // REGLA "COMPRAS" Y "MOVIMIENTOS": Todos los encabezados en mayúsculas
    const processedHeaders = headers.map(header => header.toUpperCase());
    
    const headerRow = sheet.addRow(processedHeaders);
    
    headerRow.eachCell((cell) => {
        cell.style = yellowHeaderStyle; // Aplicamos el estilo amarillo
    });
    
    // Aplicar configuraciones a la hoja (filtros, freeze, formato código)
    applySheetSettings(sheet, processedHeaders);
  };

  // --- Creación de hojas vacías ---

  // 3. Hoja "Compras" (con nuevas columnas)
  createEmptySheetWithHeaders('Compras', [
    'Código', 
    'Nombre del producto', 
    'Marca', 
    'CANTIDAD', 
    'FA', 
    'Q1', 
    'Q2', 
    'NENA', 
    'Zakipharma', 
    'VitalClinic',
    'ÚLTIMO COSTO', // Nueva columna
    'RECEPCIÓN'     // Nueva columna
  ]);
  
  // 4. Hoja "Movimientos"
  createEmptySheetWithHeaders('Movimientos', [
    'Código', 
    'Nombre del producto', 
    'Marca', 
    'CANTIDAD', 
    'DE', 
    'PARA'
  ]);
  

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