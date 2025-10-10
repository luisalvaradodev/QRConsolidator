import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConsolidatedInventoryItem, TableState } from '../types/inventory'; // Asegúrate de importar ConsolidatedInventoryItem

interface DataTableProps {
  data: ConsolidatedInventoryItem[]; // Usamos el nuevo tipo de dato consolidado
  tableState: TableState;
  onTableStateChange: (state: TableState) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, tableState, onTableStateChange }) => {
  const { currentPage, itemsPerPage, sortColumn, sortDirection } = tableState;

  const handleSort = (column: keyof ConsolidatedInventoryItem) => {
    const newDirection: 'asc' | 'desc' = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    
    onTableStateChange({
      ...tableState,
      sortColumn: column,
      sortDirection: newDirection,
      currentPage: 1
    });
  };

  const handlePageChange = (page: number) => {
    onTableStateChange({ ...tableState, currentPage: page });
  };

  const handleItemsPerPageChange = (items: number) => {
    onTableStateChange({ ...tableState, itemsPerPage: items, currentPage: 1 });
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Manejar arrays uniéndolos en un string para comparar
      const aStr = Array.isArray(aVal) ? aVal.join(', ').toLowerCase() : String(aVal || '').toLowerCase();
      const bStr = Array.isArray(bVal) ? bVal.join(', ').toLowerCase() : String(bVal || '').toLowerCase();
      
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const SortIcon = ({ column }: { column: keyof ConsolidatedInventoryItem }) => {
    if (sortColumn !== column) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const formatValue = (value: any): string | number => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-lg">
          No hay datos para mostrar. Carga algunos archivos para comenzar.
        </p>
      </div>
    );
  }

  // Definición de las columnas de la tabla
  const columns: { key: keyof ConsolidatedInventoryItem; label: string; isNumeric?: boolean }[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombres', label: 'Nombre(s)' },
    { key: 'existenciaActual', label: 'Stock Total', isNumeric: true },
    { key: 'promedioDiario', label: 'Venta Diaria Prom.', isNumeric: true },
    { key: 'clasificacion', label: 'Clasificación' },
    { key: 'sugerido40d', label: 'Sugerido 40d', isNumeric: true },
    { key: 'sugerido45d', label: 'Sugerido 45d', isNumeric: true },
    { key: 'sugerido50d', label: 'Sugerido 50d', isNumeric: true },
    { key: 'sugerido60d', label: 'Sugerido 60d', isNumeric: true },
    { key: 'departamentos', label: 'Departamento(s)' },
    { key: 'marcas', label: 'Marca(s)' },
    { key: 'farmacias', label: 'Farmacia(s)' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Cabecera de la Tabla */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Inventario Consolidado ({data.length.toLocaleString()} productos)
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">
              Mostrar:
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    <SortIcon column={key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={`${item.codigo}-${index}`} className="hover:bg-gray-50 transition-colors">
                {columns.map(({ key, isNumeric }) => (
                  <td key={key} className={`px-4 py-3 text-sm text-gray-900 ${isNumeric ? 'text-right' : ''}`}>
                    {key === 'clasificacion' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.clasificacion === 'OK' ? 'bg-green-100 text-green-800' :
                        item.clasificacion === 'Falla' ? 'bg-red-100 text-red-800' :
                        item.clasificacion === 'Exceso' ? 'bg-yellow-100 text-yellow-800' :
                        item.clasificacion === 'No vendido' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.clasificacion}
                      </span>
                    ) : (
                      <span title={String(formatValue(item[key]))}>{String(formatValue(item[key]))}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedData.length)} de {sortedData.length.toLocaleString()} resultados
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Lógica de botones de página */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5 || currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50 transition-colors'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;