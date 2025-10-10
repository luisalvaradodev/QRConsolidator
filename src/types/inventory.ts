// Este tipo representa los datos crudos leídos de cada archivo Excel.
export interface InventoryItem {
  codigo: string;
  nombre: string;
  existenciaActual: number; // Stock Físico Real
  departamento: string;
  marca: string;
  cantidad: number;          // Stock según el Sistema
  promedioDiario: number;
  clasificacion: string;
  farmacia: string;
  costoUnitario: number;
  unidadNombre: string;
}

// Este tipo representa un producto después de consolidar todos los archivos.
export interface ConsolidatedInventoryItem {
  codigo: string;
  nombres: string[];
  existenciaActual: number; // Suma de todo el stock FÍSICO REAL
  cantidad: number;          // Suma de todo el stock DEL SISTEMA
  departamentos: string[];
  marcas: string[];
  promedioDiario: number;
  clasificacion: string;
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
  sortColumn: keyof ConsolidatedInventoryItem | 'sugerido' | null;
  sortDirection: 'asc' | 'desc';
}