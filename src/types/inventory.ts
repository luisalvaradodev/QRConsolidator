// Para leer los datos de cada archivo de farmacia
export interface InventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  departamento: string;
  marca: string;
  cantidad: number; // Representa ventas en 60d
  promedio30d: number;
  promedio40d: number;
  promedio50d: number;
  promedio60d: number;
  clasificacion: string;
  sugerido30d: number;
  sugerido40d: number;
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
  // Nuevo: existencias por farmacia
  existenciasPorFarmacia: { [farmacia: string]: number };
  departamentos: string[];
  marcas: string[];
  cantidad: number;
  promedio30d: number;
  promedio40d: number;
  promedio50d: number;
  promedio60d: number;
  clasificacion: string;
  sugerido30d: number;
  sugerido40d: number;
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

export interface ClassificationSettings {
  diasFalla: number;
  diasExceso: number;
  diasOK: { min: number; max: number };
}