import * as XLSX from 'xlsx';
import { InventoryItem } from '../types/inventory';

const COLUMN_MAPPINGS: { [key: string]: string } = {
  'código': 'codigo', 'codigo': 'codigo',
  'nombre': 'nombre',
  'existencia actual': 'existenciaActual',
  'departamento': 'departamento', 'dpto. descrip.': 'departamento',
  'marca': 'marca',
  'cantidad': 'cantidad',
  'promedio diario': 'promedioDiario',
  'sugerido 40d': 'sugerido40d',
  'sugerido 45d': 'sugerido45d',
  'sugerido 50d': 'sugerido50d',
  'sugerido 60d': 'sugerido60d',
  'exceso unidades': 'excesoUnidades',
};

const normalizeHeader = (h: string) => h ? h.toLowerCase().trim().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u') : '';

const normalizeData = (data: any[], farmaciaName: string): InventoryItem[] => {
  if (!data || data.length === 0) return [];
  const headers = Object.keys(data[0]);
  const mappedHeaders: { [key: string]: string } = {};

  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    const mappedKey = COLUMN_MAPPINGS[normalized];
    if (mappedKey) mappedHeaders[header] = mappedKey;
  });

  return data.map(row => {
    const normalizedRow: any = {};
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = mappedHeaders[key];
      if (mappedKey) normalizedRow[mappedKey] = value;
    });

    return {
      codigo: String(normalizedRow.codigo || ''),
      nombre: String(normalizedRow.nombre || ''),
      existenciaActual: Number(normalizedRow.existenciaActual) || 0,
      departamento: String(normalizedRow.departamento || 'Sin Depto.'),
      marca: String(normalizedRow.marca || 'Sin Marca'),
      cantidad: Number(normalizedRow.cantidad) || 0,
      promedioDiario: Number(normalizedRow.promedioDiario) || 0,
      sugerido40d: Number(normalizedRow.sugerido40d) || 0,
      sugerido45d: Number(normalizedRow.sugerido45d) || 0,
      sugerido50d: Number(normalizedRow.sugerido50d) || 0,
      sugerido60d: Number(normalizedRow.sugerido60d) || 0,
      excesoUnidades: Number(normalizedRow.excesoUnidades) || 0,
      farmacia: farmaciaName,
    };
  }).filter(item => item.codigo);
};

export const processFile = async (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const farmaciaName = file.name.replace(/\.(xlsx|xls|csv)$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
        resolve(normalizeData(jsonData, farmaciaName));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};