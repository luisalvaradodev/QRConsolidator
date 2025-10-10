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

export interface FilterState {
  farmacia: string[];
  departamento: string[];
  marca: string[];
  clasificacion: string[];
}

export interface TableState {
  currentPage: number;
  itemsPerPage: number;
  sortColumn: keyof InventoryItem | null;
  sortDirection: 'asc' | 'desc';
}