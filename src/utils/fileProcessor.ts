import * as XLSX from 'xlsx';
import { InventoryItem } from '../types/inventory';

interface ColumnMapping {
  [key: string]: string;
}

const COLUMN_MAPPINGS: ColumnMapping = {
  // Identificador
  'codigo': 'codigo',
  'code': 'codigo',
  'id': 'codigo',
  'identificador': 'codigo',
  
  // Descripción
  'nombre': 'nombre',
  'name': 'nombre',
  'descripcion': 'nombre',
  'description': 'nombre',
  'producto': 'nombre',
  
  // Inventario
  'existencia actual': 'existenciaActual',
  'existencia': 'existenciaActual',
  'inventario': 'existenciaActual',
  'stock': 'existenciaActual',
  'cantidad actual': 'existenciaActual',
  
  // Categoría
  'departamento': 'departamento',
  'dpto. descrip.': 'departamento',
  'departamento nombre': 'departamento',
  'categoria': 'departamento',
  'category': 'departamento',
  
  // Fabricante
  'marca': 'marca',
  'fabricante': 'marca',
  'brand': 'marca',
  'manufacturer': 'marca',
  
  // Ventas
  'cantidad': 'cantidad',
  'ventas': 'cantidad',
  'sales': 'cantidad',
  'qty': 'cantidad',
  
  // Ventas Diarias
  'promedio diario': 'promedioDiario',
  'avg daily': 'promedioDiario',
  'ventas diarias': 'promedioDiario',
  'daily average': 'promedioDiario',
  
  // Estado
  'clasificacion': 'clasificacion',
  'estado': 'clasificacion',
  'status': 'clasificacion',
  'classification': 'clasificacion',
  
  // Costos
  'costo unitario': 'costoUnitario',
  'precio unitario': 'costoUnitario',
  'unit cost': 'costoUnitario',
  'cost': 'costoUnitario',
  'costo unitario anterior': 'costoUnitarioAnterior',
  'previous unit cost': 'costoUnitarioAnterior',
  
  // Sugeridos
  'sugerido 40d': 'sugerido40d',
  'sugerido 45d': 'sugerido45d',
  'sugerido 50d': 'sugerido50d',
  'sugerido 60d': 'sugerido60d',
  'suggested 40d': 'sugerido40d',
  'suggested 45d': 'sugerido45d',
  'suggested 50d': 'sugerido50d',
  'suggested 60d': 'sugerido60d',
  
  // Excedente
  'exceso unidades': 'excesoUnidades',
  'excess units': 'excesoUnidades',
  'surplus': 'excesoUnidades',
  'excedente': 'excesoUnidades',
  
  // Unidad
  'unidad nombre': 'unidadNombre',
  'unidad': 'unidadNombre',
  'unit': 'unidadNombre',
  'unit name': 'unidadNombre'
};

export const processFile = async (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const farmaciaName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
        const processedData = normalizeData(jsonData as any[], farmaciaName);
        
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const normalizeData = (data: any[], farmaciaName: string): InventoryItem[] => {
  if (!data.length) return [];
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  const mappedHeaders: { [key: string]: string } = {};
  
  // Map headers to standardized names
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedKey = COLUMN_MAPPINGS[normalizedHeader] || header;
    mappedHeaders[header] = mappedKey;
  });
  
  return data.map(row => {
    const normalizedRow: any = { farmacia: farmaciaName };
    
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = mappedHeaders[key];
      if (mappedKey) {
        normalizedRow[mappedKey] = value;
      }
    });
    
    // Ensure required fields have default values
    return {
      codigo: normalizedRow.codigo || '',
      nombre: normalizedRow.nombre || '',
      existenciaActual: Number(normalizedRow.existenciaActual) || 0,
      departamento: normalizedRow.departamento || 'Sin categoría',
      marca: normalizedRow.marca || 'Sin marca',
      cantidad: Number(normalizedRow.cantidad) || 0,
      promedioDiario: Number(normalizedRow.promedioDiario) || 0,
      clasificacion: normalizedRow.clasificacion || 'Normal',
      costoUnitario: Number(normalizedRow.costoUnitario) || 0,
      costoUnitarioAnterior: Number(normalizedRow.costoUnitarioAnterior) || undefined,
      sugerido40d: Number(normalizedRow.sugerido40d) || undefined,
      sugerido45d: Number(normalizedRow.sugerido45d) || undefined,
      sugerido50d: Number(normalizedRow.sugerido50d) || undefined,
      sugerido60d: Number(normalizedRow.sugerido60d) || undefined,
      excesoUnidades: Number(normalizedRow.excesoUnidades) || undefined,
      unidadNombre: normalizedRow.unidadNombre || 'Unidad',
      farmacia: farmaciaName
    } as InventoryItem;
  });
};

export const exportToCSV = (data: InventoryItem[], filename: string) => {
  const headers = [
    'Código', 'Nombre', 'Existencia Actual', 'Departamento', 'Marca',
    'Cantidad', 'Promedio Diario', 'Clasificación', 'Costo Unitario',
    'Costo Unitario Anterior', 'Sugerido 40d', 'Sugerido 45d', 'Sugerido 50d',
    'Sugerido 60d', 'Exceso Unidades', 'Unidad Nombre', 'Farmacia'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${item.codigo}"`,
      `"${item.nombre}"`,
      item.existenciaActual,
      `"${item.departamento}"`,
      `"${item.marca}"`,
      item.cantidad,
      item.promedioDiario,
      `"${item.clasificacion}"`,
      item.costoUnitario,
      item.costoUnitarioAnterior || '',
      item.sugerido40d || '',
      item.sugerido45d || '',
      item.sugerido50d || '',
      item.sugerido60d || '',
      item.excesoUnidades || '',
      `"${item.unidadNombre}"`,
      `"${item.farmacia}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = (data: InventoryItem[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'Código': item.codigo,
    'Nombre': item.nombre,
    'Existencia Actual': item.existenciaActual,
    'Departamento': item.departamento,
    'Marca': item.marca,
    'Cantidad': item.cantidad,
    'Promedio Diario': item.promedioDiario,
    'Clasificación': item.clasificacion,
    'Costo Unitario': item.costoUnitario,
    'Costo Unitario Anterior': item.costoUnitarioAnterior,
    'Sugerido 40d': item.sugerido40d,
    'Sugerido 45d': item.sugerido45d,
    'Sugerido 50d': item.sugerido50d,
    'Sugerido 60d': item.sugerido60d,
    'Exceso Unidades': item.excesoUnidades,
    'Unidad Nombre': item.unidadNombre,
    'Farmacia': item.farmacia
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Consolidado');
  XLSX.writeFile(workbook, filename);
};
