// Para leer los datos de cada archivo de farmacia
export interface InventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  departamento: string;
  marca: string;
  cantidad: number; // Representa ventas en 60d
  clasificacion: string;
  excesoUnidades: number;
  farmacia: string;
  monedaFactorCambio: number;
  costoUnitario: number;
  utilidad: number;
  precioMaximo: number;
  [key: string]: any; // Para promedios y sugeridos dinámicos
}

// Para el resultado final consolidado
export interface ConsolidatedInventoryItem {
  codigo: string;
  nombres: string[];
  existenciaActual: number;
  existenciasPorFarmacia: { [farmacia: string]: number };
  departamentos: string[];
  marcas: string[];
  cantidad: number;
  clasificacion: string;
  excesoUnidades: number;
  farmacias: string[];
  monedaFactorCambio: number;
  costoUnitario: number;
  utilidad: number;
  precioMaximo: number;
  [key: string]: any; // Para promedios y sugeridos dinámicos
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
  periodos: number[];
}