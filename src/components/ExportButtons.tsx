import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
// --- MODIFICACIÓN: Importar ambos tipos ---
import { InventoryItem, ConsolidatedInventoryItem, ClassificationSettings } from '../types/inventory';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExportButtonsProps {
  rawData: InventoryItem[];
  consolidatedData: ConsolidatedInventoryItem[]; // <-- Prop de la corrección anterior
  settings: ClassificationSettings;
}

// --- INICIO: Función de exportación modificada ---
const exportToExcel = async (
  rawData: InventoryItem[],
  consolidatedData: ConsolidatedInventoryItem[], // <-- Parámetro de la corrección anterior
  settings: ClassificationSettings,
  filename: string
) => {
  const workbook = new ExcelJS.Workbook();

  const roundToTwoDecimals = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.round(value * 100) / 100;
  };

  const calcularCantidadConsolidada = (item: InventoryItem | ConsolidatedInventoryItem, settings: ClassificationSettings) => {
    const promedioDiario = item.cantidad / 60;
    
    switch (item.clasificacion) {
      case 'Falla':
        return Math.max(0, Math.ceil((promedioDiario * settings.diasFalla) - item.existenciaActual));
      case 'Exceso':
        return item.excesoUnidades;
      case 'No vendido':
        return item.existenciaActual;
      case 'OK':
        const sugerenciasPositivas = settings.periodos
          .map(days => {
            const required = promedioDiario * days;
            const suggestion = (required - item.existenciaActual);
            // Corregido: item[`sugerido${days}d`] no existe en el item crudo, hay que calcularlo
            return Math.max(0, Math.ceil(suggestion));
          })
          .filter(s => s > 0);
        return sugerenciasPositivas.length > 0 ? Math.min(...sugerenciasPositivas) : 0;
      default:
        return 0;
    }
  };

  // --- Mapper para items CONSOLIDADOS (Hoja 'Consolidado') ---
  const mapConsolidatedItemToRow = (item: ConsolidatedInventoryItem) => {
    const sugeridoColumns: { [key: string]: any } = {};
    const promedioColumns: { [key: string]: any } = {};
    const sortedPeriodos = [...settings.periodos].sort((a, b) => a - b);

    sortedPeriodos.forEach(p => {
      sugeridoColumns[`Sugerido ${p}d`] = item[`sugerido${p}d`] || 0;
    });

    sortedPeriodos.forEach(p => {
      promedioColumns[`Prom. ${p}d`] = Math.ceil(item[`promedio${p}d`] || 0);
    });

    const sugeridosList = settings.periodos
      .map(p => ({ dias: p, cantidad: item[`sugerido${p}d`] || 0 }))
      .filter(s => s.cantidad > 0);
    
    // Usamos \n para saltos de línea en Excel
    const sugeridosString = sugeridosList.length > 0
      ? `Sugeridos:\n${sugeridosList.map(s => ` - ${s.cantidad} (p/${s.dias}d)`).join('\n')}`
      : "Sugeridos: [Ninguno]";
    
    const cantFalla = item.clasificacion === 'Falla' ? item.cantidadConsolidada : 0;
    const cantExceso = item.clasificacion === 'Exceso' ? item.cantidadConsolidada : 0;
    const cantNoVendido = item.clasificacion === 'No vendido' ? item.cantidadConsolidada : 0;
    const cantOK = item.clasificacion === 'OK' ? item.cantidadConsolidada : 0;

    const farmacyStockString = Object.entries(item.existenciasPorFarmacia)
      .map(([farmacia, stock]) => `${farmacia}: ${stock || 0}`)
      .join(' | ');
      
    const totalStockString = `Stock Total: ${item.existenciaActual.toLocaleString()}`;
    const totalAComprar = item.cantidadConsolidada;

    // --- REVERSIÓN: Este es el texto que irá en la celda ---
    const summaryText = `Producto: ${item.nombres.join(', ')}
ID: ${item.codigo}
---
Stock por Farmacia: ${farmacyStockString}
${totalStockString} 
---
Clasificación: ${item.clasificacion}
---
TOTAL A COMPRAR (Acción): ${totalAComprar.toLocaleString()}
---
Desglose de Acción:
 - Cant. Falla: ${cantFalla.toLocaleString()}
 - Cant. Exceso: ${cantExceso.toLocaleString()}
 - Cant. No Vendido: ${cantNoVendido.toLocaleString()}
 - Cant. OK (Sugerido): ${cantOK.toLocaleString()}
---
${sugeridosString}
    `;

    return {
      'Código': item.codigo,
      'Nombre del producto': item.nombres.join(', '),
      'Marca': item.marcas.join(', '),
      'Departamento': item.departamentos.join(', '),
      'Farmacia': 'Consolidado',
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      // --- REVERSIÓN: El valor de la celda es el texto completo ---
      'Cantidad Consolidada': summaryText,
      // ---
      'Exceso': item.excesoUnidades,
      ...sugeridoColumns,
      ...promedioColumns,
      'Moneda factor de cambio': item.monedaFactorCambio,
      'Costo Unitario': item.costoUnitario,
      '%Util.': roundToTwoDecimals(item.utilidad),
      'Precio máximo': item.precioMaximo,
    };
  };

  // --- Mapper para items CRUDOS (Hojas por farmacia) ---
  const mapRawItemToRow = (item: InventoryItem) => {
    const sugeridoColumns: { [key: string]: any } = {};
    const promedioColumns: { [key: string]: any } = {};
    const sortedPeriodos = [...settings.periodos].sort((a, b) => a - b);

    sortedPeriodos.forEach(p => {
      sugeridoColumns[`Sugerido ${p}d`] = item[`sugerido${p}d`] || 0;
    });

    sortedPeriodos.forEach(p => {
      promedioColumns[`Prom. ${p}d`] = Math.ceil(item[`promedio${p}d`] || 0);
    });

    const totalStockString = `Stock Total: ${item.existenciaActual.toLocaleString()} (en ${item.farmacia})`;
    const totalAComprar = calcularCantidadConsolidada(item, settings);

    // --- REVERSIÓN: Este es el texto que irá en la celda ---
    const summaryText = `Producto: ${item.nombre}
ID: ${item.codigo}
---
${totalStockString}
---
Clasificación: ${item.clasificacion}
---
TOTAL A COMPRAR (Acción): ${totalAComprar.toLocaleString()}
    `;

    return {
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Farmacia': item.farmacia,
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      // --- REVERSIÓN: El valor de la celda es el texto completo ---
      'Cantidad Consolidada': summaryText,
      // ---
      'Exceso': item.excesoUnidades,
      ...sugeridoColumns,
      ...promedioColumns,
      'Moneda factor de cambio': item.monedaFactorCambio,
      'Costo Unitario': item.costoUnitario,
      '%Util.': roundToTwoDecimals(item.utilidad),
      'Precio máximo': item.precioMaximo,
    };
  };
  // --- FIN DE LOS MAPPERS ---


  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FF000000' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    },
  };

  // --- FUNCIÓN 'addSheetWithStyles' MODIFICADA (REVERTIDA) ---
  const addSheetWithStyles = (sheetName: string, data: any[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const headerRow = sheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    // --- Lógica para la columna 'Cantidad Consolidada' ---
    const consolidatedColIndex = headers.indexOf('Cantidad Consolidada');
    if (consolidatedColIndex > -1) {
      const col = sheet.getColumn(consolidatedColIndex + 1); // +1 porque ExcelJS es 1-based
      col.width = 60; // Ancho grande para el texto
      col.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }; // Formato de texto
    }
    
    // --- Lógica de añadir filas (simple, sin comentarios) ---
    data.forEach(item => {
      const rowData = headers.map(header => item[header]);
      sheet.addRow(rowData);
    });
  };
  // --- FIN DE LA FUNCIÓN 'addSheetWithStyles' MODIFICADA ---

  // 1. Hoja 'Consolidado' (usa los datos CONSOLIDADOS que ve el usuario)
  const consolidatedDataForExport = consolidatedData.map(mapConsolidatedItemToRow);
  addSheetWithStyles('Consolidado', consolidatedDataForExport);

  // 2. Hojas por Farmacia (usa los datos CRUDOS como antes)
  const farmaciaGroups = rawData.reduce((groups, item) => {
    const farmacia = item.farmacia || 'Sin Farmacia';
    if (!groups[farmacia]) {
      groups[farmacia] = [];
    }
    groups[farmacia].push(mapRawItemToRow(item)); // <-- Usa el mapper de items crudos
    return groups;
  }, {} as { [key: string]: any[] });

  Object.entries(farmaciaGroups).forEach(([farmacia, data]) => {
    const validFarmaciaName = farmacia.replace(/[/\\?*[\]]/g, ' ').substring(0, 31);
    addSheetWithStyles(validFarmaciaName, data);
  });
  
  
  const createEmptySheetWithHeaders = (sheetName: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.style = headerStyle;
    });
  };

  createEmptySheetWithHeaders('Compras', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'FA', 'Q1', 'Q2', 'NENA', 'Zakipharma', 'VitalClinic']);
  createEmptySheetWithHeaders('Movimientos', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'DE', 'PARA']);
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};
// --- FIN: Función de exportación modificada ---


const ExportButtons: React.FC<ExportButtonsProps> = ({ rawData, consolidatedData, settings }) => {
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(rawData, consolidatedData, settings, `inventario_consolidado_${timestamp}.xlsx`);
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
        {consolidatedData.length.toLocaleString()} productos consolidados
      </p>
    </div>
  );
};

export default ExportButtons;