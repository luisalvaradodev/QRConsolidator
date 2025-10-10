// Para leer los datos de cada archivo de farmacia
export interface InventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  departamento: string;
  marca: string;
  cantidad: number;
  promedioDiario: number;
  sugerido40d: number;
  sugerido45d: number;
  sugerido50d: number;
  sugerido60d: number;
  excesoUnidades: number;
  farmacia: string;
}

// Para el resultado final consolidado
export interface ConsolidatedInventoryItem {
  codigo: string;
  nombres: string[];
  existenciaActual: number;
  departamentos: string[];
  marcas: string[];
  cantidad: number;
  promedioDiario: number;
  clasificacion: string;
  sugerido40d: number;
  sugerido45d: number;
  sugerido50d: number;
  sugerido60d: number;
  excesoUnidades: number;
  farmacias: string[];
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