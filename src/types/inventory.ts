export interface InventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number;
  departamento: string;
  marca: string;
  cantidad: number;
  promedioDiario: number;
  clasificacion: string;
  costoUnitario: number;
  costoUnitarioAnterior?: number;
  sugerido40d?: number;
  sugerido45d?: number;
  sugerido50d?: number;
  sugerido60d?: number;
  excesoUnidades?: number;
  unidadNombre: string;
  farmacia: string;
}

// --- NUEVA INTERFAZ PARA DATOS CONSOLIDADOS ---
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
  // --- ACTUALIZADO PARA USAR LAS NUEVAS PROPIEDADES ---
  sortColumn: keyof ConsolidatedInventoryItem | null;
  sortDirection: 'asc' | 'desc';
}