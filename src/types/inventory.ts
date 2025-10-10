// Para leer cualquier archivo de entrada
export interface RawInventoryItem {
  codigo?: string;
  nombre?: string;
  existenciaActual?: number;
  cantidad?: number; // Representa las ventas en los archivos de "productos vendidos"
  departamento?: string;
  marca?: string;
  sourceFile: string; // Para saber si es un listado de stock o de ventas
}

// El objeto final con todos los cálculos realizados
export interface ConsolidatedInventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  venta60d: number;
  venta30d: number;
  ventaDiaria: number;
  diasDeInventario: number;
  clasificacion: string;
  sugerido40d: number;
  sugerido45d: number;
  sugerido50d: number;
  sugerido60d: number;
  excesoUnidades: number;
  departamento: string;
  marca: string;
  farmacias: string[]; // Para saber en qué farmacias está listado
}

export interface FilterState {
  farmacia: string[];
  departamento: string[];
  marca: string[];
  clasificacion: string[];
}

export interface TableState {
  currentPage: number;
  itemsPerPage: number;
  sortColumn: keyof ConsolidatedInventoryItem | null;
  sortDirection: 'asc' | 'desc';
}