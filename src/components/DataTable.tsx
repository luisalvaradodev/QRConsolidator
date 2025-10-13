// src/components/DataTable.tsx

import React, { useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConsolidatedInventoryItem, TableState } from '../types/inventory';

interface DataTableProps {
  data: ConsolidatedInventoryItem[];
  tableState: TableState;
  onTableStateChange: (state: TableState) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, tableState, onTableStateChange }) => {
  const { currentPage, itemsPerPage, sortColumn, sortDirection } = tableState;

  const handleSort = (column: keyof ConsolidatedInventoryItem) => {
    const newDirection = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    onTableStateChange({ ...tableState, sortColumn: column, sortDirection: newDirection, currentPage: 1 });
  };
  
  const handlePageChange = (page: number) => onTableStateChange({ ...tableState, currentPage: page });

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTableStateChange({
      ...tableState,
      itemsPerPage: Number(e.target.value),
      currentPage: 1,
    });
  };
  
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = Array.isArray(aVal) ? aVal.join(', ') : String(aVal || '');
      const bStr = Array.isArray(bVal) ? bVal.join(', ') : String(bVal || '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection]);
  
  const totalItems = sortedData.length;
  const displayItemsPerPage = itemsPerPage === 0 ? totalItems : itemsPerPage;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / displayItemsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * displayItemsPerPage,
    currentPage * displayItemsPerPage
  );

  const SortIcon = ({ column }: { column: keyof ConsolidatedInventoryItem }) => {
    if (sortColumn !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
  };

  const columns = [
    { key: 'codigo', label: 'Código' }, 
    { key: 'nombres', label: 'Nombre' },
    { key: 'existenciaActual', label: 'Exist. Actual', isNumeric: true },
    { key: 'departamentos', label: 'Departamento' }, 
    { key: 'marcas', label: 'Marca' },
    { key: 'cantidad', label: 'Cantidad', isNumeric: true }, 
    { key: 'promedioDiario', label: 'Prom. Diario', isNumeric: true },
    { key: 'clasificacion', label: 'Clasificación' },
    { key: 'sugerido40d', label: 'Sug. 40d', isNumeric: true },
    { key: 'sugerido45d', label: 'Sug. 45d', isNumeric: true },
    { key: 'sugerido50d', label: 'Sug. 50d', isNumeric: true },
    { key: 'sugerido60d', label: 'Sug. 60d', isNumeric: true },
    { key: 'excesoUnidades', label: 'Exceso Und.', isNumeric: true },
    { key: 'farmacias', label: 'Farmacia' },
  ];

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-300">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No hay productos que coincidan con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`group p-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${col.isNumeric ? 'text-right' : 'text-left'}`} onClick={() => handleSort(col.key as keyof ConsolidatedInventoryItem)}>
                  <div className={`flex items-center gap-1 ${col.isNumeric ? 'justify-end' : ''}`}>{col.label}<SortIcon column={col.key as keyof ConsolidatedInventoryItem}/></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item, index) => (
              <tr key={item.codigo} className={`transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'} hover:bg-blue-50 dark:hover:bg-gray-700/50`}>
                <td className="p-3 font-mono text-xs truncate max-w-xs" title={item.codigo}>{item.codigo}</td>
                <td className="p-3 truncate max-w-xs" title={item.nombres.join(', ')}>{item.nombres.join(', ')}</td>
                <td className="p-3 text-right font-medium">{item.existenciaActual.toLocaleString()}</td>
                <td className="p-3 truncate max-w-xs" title={item.departamentos.join(', ')}>{item.departamentos.join(', ')}</td>
                <td className="p-3 truncate max-w-xs" title={item.marcas.join(', ')}>{item.marcas.join(', ')}</td>
                <td className="p-3 text-right">{item.cantidad.toLocaleString()}</td>
                <td className="p-3 text-right">{item.promedioDiario.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-full px-2 py-1 text-xs font-semibold rounded-full ${
                    item.clasificacion === 'Falla' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                    item.clasificacion === 'Exceso' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    item.clasificacion === 'No vendido' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  }`}>
                    {item.clasificacion}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.sugerido40d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.sugerido45d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.sugerido50d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.sugerido60d.toLocaleString()}</td>
                <td className="p-3 text-right font-medium text-orange-600 dark:text-orange-400">{item.excesoUnidades.toLocaleString()}</td>
                <td className="p-3 truncate max-w-xs" title={item.farmacias.join(', ')}>{item.farmacias.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>Mostrar</span>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={0}>Todo</option>
          </select>
          <span>
            {itemsPerPage > 0
              ? `Página ${currentPage} de ${totalPages}`
              : `Mostrando ${totalItems.toLocaleString()} productos`
            }
          </span>
        </div>
        
        {itemsPerPage > 0 && totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 text-sm">
                {currentPage}
            </span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;