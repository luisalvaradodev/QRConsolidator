// src/types/inventory.ts

// Tipo genérico para leer CUALQUIER archivo inicial
export interface RawInventoryItem {
  codigo?: string;
  nombre?: string;
  existenciaActual?: number;
  cantidad?: number; // Puede ser stock de sistema o ventas, dependiendo del archivo
  departamento?: string;
  marca?: string;
  // Añadimos el nombre del archivo para identificar su tipo
  sourceFile: string; 
}

// El objeto final, con todos los cálculos hechos
export interface ConsolidatedInventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  venta60d: number;
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
  farmacias: string[]; // Para saber en qué listas de stock aparece
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