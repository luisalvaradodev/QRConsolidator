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

  // Función para calcular cantidad consolidada basada en la clasificación
  const calcularCantidadConsolidada = (item: InventoryItem, settings: ClassificationSettings) => {
    const promedioDiario = item.cantidad / 60;
    
    switch (item.clasificacion) {
      case 'Falla':
        return Math.max(0, Math.ceil((promedioDiario * settings.diasFalla) - item.existenciaActual));
      case 'Exceso':
        return item.excesoUnidades;
      case 'No vendido':
        return item.existenciaActual;
      case 'OK':
        // Para OK, calculamos si hay necesidad de comprar para el período mínimo
        const sugerenciasPositivas = settings.periodos
          .map(days => {
            const required = promedioDiario * days;
            const suggestion = required - item.existenciaActual;
            return Math.max(0, Math.ceil(suggestion));
          })
          .filter(s => s > 0);
        return sugerenciasPositivas.length > 0 ? Math.min(...sugerenciasPositivas) : 0;
      default:
        return 0;
    }
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

    // --- INICIO DE LA MODIFICACIÓN ---
      
    // 1. Calcular la cantidad consolidada
    const cantidadConsolidada = calcularCantidadConsolidada(item, settings);
    
    // 2. Obtener todas las sugerencias positivas
    const sugeridosList = settings.periodos
      .map(p => ({ 
          dias: p, 
          cantidad: item[`sugerido${p}d`] || 0 
      }))
      .filter(s => s.cantidad > 0);
    
    // 3. Formatear la lista de sugerencias
    const sugeridosString = sugeridosList.length > 0
      ? `Sugeridos: [${sugeridosList.map(s => `${s.cantidad} (p/${s.dias}d)`).join(', ')}]`
      : "Sugeridos: [Ninguno]";
    
    // 4. Obtener las cantidades específicas por clasificación
    const cantFalla = item.clasificacion === 'Falla' ? cantidadConsolidada : 0;
    const cantExceso = item.clasificacion === 'Exceso' ? cantidadConsolidada : 0;
    const cantNoVendido = item.clasificacion === 'No vendido' ? cantidadConsolidada : 0;
    const cantOK = item.clasificacion === 'OK' ? cantidadConsolidada : 0;

    // 5. Construir el string de texto (usamos \n para saltos de línea en Excel)
    const summaryText = `Producto: ${item.nombre}
ID: ${item.codigo}
---
Clasificación: ${item.clasificacion}
---
Cant. Falla: ${cantFalla.toLocaleString()}
Cant. Exceso: ${cantExceso.toLocaleString()}
Cant. No Vendido: ${cantNoVendido.toLocaleString()}
Cant. OK (Sugerido): ${cantOK.toLocaleString()}
---
${sugeridosString}
    `;
    // --- FIN DE LA MODIFICACIÓN ---

    return {
      'Código': item.codigo,
      'Nombre del producto': item.nombre,
      'Marca': item.marca,
      'Departamento': item.departamento,
      'Farmacia': item.farmacia,
      'Existencia Actual': item.existenciaActual,
      'Cant. Vendida 60 días': item.cantidad,
      'Clasificación': item.clasificacion,
      'Cantidad Consolidada': summaryText, // <-- VALOR MODIFICADO
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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Estilos para la columna 'Cantidad Consolidada'
    const colIndex = headers.indexOf('Cantidad Consolidada') + 1; // ExcelJS es 1-based
    if (colIndex > 0) {
      const col = sheet.getColumn(colIndex);
      col.width = 60; // Ancho generoso
      col.alignment = { 
        wrapText: true,       // Habilitar ajuste de texto
        vertical: 'top',      // Alinear arriba
        horizontal: 'left'  // Alinear a la izquierda
      };
    }
    // --- FIN DE LA MODIFICACIÓN ---

    const rows = data.map(item => {
      return headers.map(header => item[header]);
    });
    sheet.addRows(rows);
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
    // Reemplazamos caracteres inválidos para el nombre de la hoja
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

  // Se crearon las hojas "Compras" y "Movimientos" (con los encabezados invertidos según el código original)
  createEmptySheetWithHeaders('Compras', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'FA', 'Q1', 'Q2', 'NENA', 'Zakipharma', 'VitalClinic']);
  createEmptySheetWithHeaders('Movimientos', ['Código', 'Nombre del producto', 'Marca', 'CANTIDAD', 'DE', 'PARA']);
  

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