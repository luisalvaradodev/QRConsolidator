import * as XLSX from 'xlsx';
import { InventoryItem } from '../types/inventory';

interface ColumnMapping {
  [key: string]: string;
}

// Mapeo robusto de posibles nombres de columnas a un nombre estandarizado
const COLUMN_MAPPINGS: ColumnMapping = {
  // Identificador
  'código': 'codigo', 'codigo': 'codigo', 'code': 'codigo', 'id': 'codigo', 'identificador': 'codigo',
  // Descripción
  'nombre': 'nombre', 'name': 'nombre', 'descripcion': 'nombre', 'description': 'nombre', 'producto': 'nombre',
  // Inventario
  'existencia actual': 'existenciaActual', 'existenciaactual': 'existenciaActual', 'existencia': 'existenciaActual', 'inventario': 'existenciaActual', 'stock': 'existenciaActual',
  // Categoría
  'departamento': 'departamento', 'dpto. descrip.': 'departamento', 'departamento nombre': 'departamento',
  // Fabricante
  'marca': 'marca', 'fabricante': 'marca',
  // Ventas (Stock del Sistema)
  'cantidad': 'cantidad', 'ventas': 'cantidad',
  // Ventas Diarias
  'promedio diario': 'promedioDiario', 'promediodiario': 'promedioDiario',
  // Estado
  'clasificacion': 'clasificacion', 'estado': 'clasificacion'
};

const normalizeHeader = (header: string): string => {
  if (!header) return '';
  return header.toLowerCase().trim().replace(/\s+/g, ' ').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
};

const normalizeData = (data: any[], farmaciaName: string): InventoryItem[] => {
  if (!data || data.length === 0) return [];
  
  const headers = Object.keys(data[0]);
  const mappedHeaders: { [key: string]: string } = {};
  
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    const mappedKey = COLUMN_MAPPINGS[normalized];
    if (mappedKey) {
      mappedHeaders[header] = mappedKey;
    }
  });
  
  return data.map(row => {
    const normalizedRow: any = { farmacia: farmaciaName };
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = mappedHeaders[key];
      if (mappedKey) {
        normalizedRow[mappedKey] = value;
      }
    });
    
    return {
      codigo: String(normalizedRow.codigo || ''),
      nombre: String(normalizedRow.nombre || 'Sin nombre'),
      existenciaActual: Number(normalizedRow.existenciaActual) || 0,
      departamento: String(normalizedRow.departamento || 'Sin categoría'),
      marca: String(normalizedRow.marca || 'Sin marca'),
      cantidad: Number(normalizedRow.cantidad) || 0,
      promedioDiario: Number(normalizedRow.promedioDiario) || 0,
      clasificacion: String(normalizedRow.clasificacion || 'Normal'),
      farmacia: farmaciaName,
      costoUnitario: 0,
      unidadNombre: '',
    };
  }).filter(item => item.codigo);
};

export const processFile = async (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const farmaciaName = file.name.replace(/\.(xlsx|xls|csv)$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
        const processedData = normalizeData(jsonData as any[], farmaciaName);
        resolve(processedData);
      } catch (error) {
        console.error("Error procesando el archivo:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error("Error leyendo el archivo:", error);
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
};