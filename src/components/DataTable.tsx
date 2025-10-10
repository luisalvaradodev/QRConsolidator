import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ConsolidatedInventoryItem, TableState } from '../types/inventory';

interface DataTableProps {
  data: ConsolidatedInventoryItem[];
  tableState: TableState;
  onTableStateChange: (state: TableState) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, tableState, onTableStateChange }) => {
  const { currentPage, itemsPerPage, sortColumn, sortDirection } = tableState;
  const [suggestionDays, setSuggestionDays] = useState([40, 45, 50, 60]);

  const handleDayChange = (index: number, value: string) => {
    const newDays = [...suggestionDays];
    const dayValue = parseInt(value, 10);
    newDays[index] = isNaN(dayValue) ? 0 : dayValue; // Asegurarse de que sea un número
    setSuggestionDays(newDays);
  };

  // Memoiza los datos procesados para evitar recálculos innecesarios
  const processedData = useMemo(() => {
    return data.map(item => {
      const suggestions = suggestionDays.map(days => 
        Math.max(0, Math.round(item.promedioDiario * days) - item.existenciaActual)
      );
      return { ...item, suggestions };
    });
  }, [data, suggestionDays]);

  const handleSort = (column: any) => {
    const newDirection: 'asc' | 'desc' = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    onTableStateChange({ ...tableState, sortColumn: column, sortDirection: newDirection, currentPage: 1 });
  };
  
  const handlePageChange = (page: number) => {
    onTableStateChange({ ...tableState, currentPage: page });
  };


  const sortedData = useMemo(() => {
    if (!sortColumn) return processedData;
    
    return [...processedData].sort((a, b) => {
      let aVal, bVal;
      // Lógica para ordenar por columnas de sugerencia dinámica
      if (typeof sortColumn === 'string' && sortColumn.startsWith('sugerido-')) {
        const index = parseInt(sortColumn.split('-')[1], 10);
        aVal = a.suggestions[index];
        bVal = b.suggestions[index];
      } else {
        aVal = a[sortColumn as keyof ConsolidatedInventoryItem];
        bVal = b[sortColumn as keyof ConsolidatedInventoryItem];
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = Array.isArray(aVal) ? aVal.join(', ').toLowerCase() : String(aVal || '').toLowerCase();
      const bStr = Array.isArray(bVal) ? bVal.join(', ').toLowerCase() : String(bVal || '').toLowerCase();
      
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [processedData, sortColumn, sortDirection]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const SortIcon = ({ column }: { column: any }) => {
    if (sortColumn !== column) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-lg">
          No hay datos para mostrar. Carga archivos para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Sección de Controles Dinámicos */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
                <SlidersHorizontal className="h-5 w-5 text-gray-600"/>
                <h4 className="font-semibold text-gray-800">Sugerencias Dinámicas (días)</h4>
            </div>
            <div className="flex items-center space-x-2">
                {suggestionDays.map((days, index) => (
                    <input
                        key={index}
                        type="number"
                        value={days}
                        onChange={(e) => handleDayChange(index, e.target.value)}
                        className="w-16 p-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{width: '12%'}} onClick={() => handleSort('codigo')}><div className="flex items-center">Código<SortIcon column='codigo'/></div></th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{width: '20%'}} onClick={() => handleSort('nombres')}><div className="flex items-center">Nombre<SortIcon column='nombres'/></div></th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{width: '9%'}} onClick={() => handleSort('existenciaActual')}><div className="flex items-center justify-end">Stock Actual<SortIcon column='existenciaActual'/></div></th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden sm:table-cell" style={{width: '9%'}} onClick={() => handleSort('cantidad')}><div className="flex items-center justify-end">Ventas<SortIcon column='cantidad'/></div></th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden md:table-cell" style={{width: '9%'}} onClick={() => handleSort('promedioDiario')}><div className="flex items-center justify-end">Venta Diaria<SortIcon column='promedioDiario'/></div></th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{width: '10%'}} onClick={() => handleSort('clasificacion')}><div className="flex items-center">Clasificación<SortIcon column='clasificacion'/></div></th>
              {suggestionDays.map((days, index) => (
                  <th key={index} className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{width: '8%'}} onClick={() => handleSort(`sugerido-${index}`)}>
                      <div className="flex items-center justify-end">Sug. {days}d<SortIcon column={`sugerido-${index}`}/></div>
                  </th>
              ))}
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell" style={{width: '10%'}} onClick={() => handleSort('farmacias')}><div className="flex items-center">Farmacias<SortIcon column='farmacias'/></div></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={`${item.codigo}-${index}`} className="hover:bg-gray-50">
                <td className="p-3 font-mono truncate" title={item.codigo}>{item.codigo}</td>
                <td className="p-3 truncate" title={item.nombres.join(', ')}>{item.nombres.join(', ')}</td>
                <td className="p-3 text-right font-medium">{item.existenciaActual}</td>
                <td className="p-3 text-right hidden sm:table-cell">{item.cantidad}</td>
                <td className="p-3 text-right hidden md:table-cell">{item.promedioDiario.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-full px-2 py-1 text-xs font-semibold rounded-full ${
                    item.clasificacion === 'OK' ? 'bg-green-100 text-green-800' :
                    item.clasificacion === 'Falla' ? 'bg-red-100 text-red-800' :
                    item.clasificacion === 'Exceso' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.clasificacion}
                  </span>
                </td>
                {item.suggestions.map((sug, i) => (
                    <td key={i} className="p-3 text-right font-bold text-blue-600">{sug}</td>
                ))}
                <td className="p-3 truncate hidden lg:table-cell" title={item.farmacias.join(', ')}>{item.farmacias.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;