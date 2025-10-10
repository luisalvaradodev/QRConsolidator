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
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ column }: { column: keyof ConsolidatedInventoryItem }) => {
    if (sortColumn !== column) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  const columns = [
    { key: 'codigo', label: 'Código' }, { key: 'nombres', label: 'Nombre' },
    { key: 'existenciaActual', label: 'Exist. Actual', isNumeric: true },
    { key: 'departamentos', label: 'Departamento' }, { key: 'marcas', label: 'Marca' },
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-lg">Carga los archivos de tus farmacias para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`p-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${col.isNumeric ? 'text-right' : 'text-left'}`} onClick={() => handleSort(col.key as keyof ConsolidatedInventoryItem)}>
                  <div className={`flex items-center ${col.isNumeric ? 'justify-end' : ''}`}>{col.label}<SortIcon column={col.key as keyof ConsolidatedInventoryItem}/></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.codigo} className="hover:bg-gray-50">
                <td className="p-3 font-mono truncate" title={item.codigo}>{item.codigo}</td>
                <td className="p-3 truncate" title={item.nombres.join(', ')}>{item.nombres.join(', ')}</td>
                <td className="p-3 text-right font-medium">{item.existenciaActual}</td>
                <td className="p-3 truncate" title={item.departamentos.join(', ')}>{item.departamentos.join(', ')}</td>
                <td className="p-3 truncate" title={item.marcas.join(', ')}>{item.marcas.join(', ')}</td>
                <td className="p-3 text-right">{item.cantidad}</td>
                <td className="p-3 text-right">{item.promedioDiario.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-full px-2 py-1 text-xs font-semibold rounded-full ${
                    item.clasificacion === 'Falla' ? 'bg-red-100 text-red-800' :
                    item.clasificacion === 'Exceso' ? 'bg-yellow-100 text-yellow-800' :
                    item.clasificacion === 'No vendido' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.clasificacion}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-blue-600">{item.sugerido40d}</td>
                <td className="p-3 text-right font-bold text-blue-600">{item.sugerido45d}</td>
                <td className="p-3 text-right font-bold text-blue-600">{item.sugerido50d}</td>
                <td className="p-3 text-right font-bold text-blue-600">{item.sugerido60d}</td>
                <td className="p-3 text-right font-medium text-orange-600">{item.excesoUnidades}</td>
                <td className="p-3 truncate" title={item.farmacias.join(', ')}>{item.farmacias.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">Página {currentPage} de {totalPages}</div>
        <div className="flex items-center space-x-1">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;