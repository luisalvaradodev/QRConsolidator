// src/utils/fileProcessor.ts

import * as XLSX from 'xlsx';
import { RawInventoryItem } from '../types/inventory'; // Usamos el nuevo tipo Raw

interface ColumnMapping { [key: string]: string; }

const COLUMN_MAPPINGS: ColumnMapping = {
  'código': 'codigo', 'codigo': 'codigo',
  'nombre': 'nombre',
  'existencia actual': 'existenciaActual', 'existencia': 'existenciaActual',
  'cantidad': 'cantidad', // Esta es la columna clave que puede significar ventas
  'departamento': 'departamento', 'dpto. descrip.': 'departamento', 'departamento nombre': 'departamento',
  'marca': 'marca',
};

const normalizeHeader = (header: string): string => {
  if (!header) return '';
  return header.toLowerCase().trim().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
};

const normalizeData = (data: any[], fileName: string): RawInventoryItem[] => {
  if (!data || data.length === 0) return [];
  const headers = Object.keys(data[0]);
  const mappedHeaders: { [key: string]: string } = {};

  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    const mappedKey = COLUMN_MAPPINGS[normalized];
    if (mappedKey) mappedHeaders[header] = mappedKey;
  });

  return data.map(row => {
    const normalizedRow: any = { sourceFile: fileName }; // Guardamos el origen
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = mappedHeaders[key];
      if (mappedKey) normalizedRow[mappedKey] = value;
    });

    return {
      codigo: String(normalizedRow.codigo || '').trim(),
      nombre: String(normalizedRow.nombre || 'Sin nombre').trim(),
      existenciaActual: Number(normalizedRow.existenciaActual) || 0,
      cantidad: Number(normalizedRow.cantidad) || 0,
      departamento: String(normalizedRow.departamento || 'Sin categoría').trim(),
      marca: String(normalizedRow.marca || 'Sin marca').trim(),
      sourceFile: fileName,
    };
  }).filter(item => item.codigo && !item.nombre?.toUpperCase().includes('COD01')); // Filtramos COD01 aquí
};

export const processFile = async (file: File): Promise<RawInventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const processedData = normalizeData(jsonData as any[], file.name);
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};