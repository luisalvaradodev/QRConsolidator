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

  // Obtenemos una lista única y ordenada de farmacias para crear columnas dinámicas.
  const farmaciasUnicas = useMemo(() => {
    const farmaciasSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item.existenciasPorFarmacia).forEach(farmacia => {
        farmaciasSet.add(farmacia);
      });
    });
    return Array.from(farmaciasSet).sort();
  }, [data]);

  const handleSort = (column: keyof ConsolidatedInventoryItem | string) => {
    const newDirection = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    onTableStateChange({ ...tableState, sortColumn: column as any, sortDirection: newDirection, currentPage: 1 });
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
      const isFarmaciaColumn = farmaciasUnicas.includes(sortColumn as string);
      
      const aVal = isFarmaciaColumn ? a.existenciasPorFarmacia[sortColumn as string] || 0 : a[sortColumn as keyof ConsolidatedInventoryItem];
      const bVal = isFarmaciaColumn ? b.existenciasPorFarmacia[sortColumn as string] || 0 : b[sortColumn as keyof ConsolidatedInventoryItem];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = Array.isArray(aVal) ? aVal.join(', ') : String(aVal || '');
      const bStr = Array.isArray(bVal) ? bVal.join(', ') : String(bVal || '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection, farmaciasUnicas]);
  
  const totalItems = sortedData.length;
  const displayItemsPerPage = itemsPerPage === 0 ? totalItems : itemsPerPage;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / displayItemsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * displayItemsPerPage,
    currentPage * displayItemsPerPage
  );

  const SortIcon = ({ column }: { column: keyof ConsolidatedInventoryItem | string }) => {
    if (sortColumn !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />;
  };

  const columns = [
    { key: 'codigo', label: 'Código' }, 
    { key: 'nombres', label: 'Nombre' },
    { key: 'marcas', label: 'Marca' },
    { key: 'departamentos', label: 'Departamento' }, 
    { key: 'existenciaActual', label: 'Exist. Total', isNumeric: true },
    // --- CAMBIO AÑADIDO ---
    { key: 'cantidad', label: 'Cant. 60d', isNumeric: true }, // Columna para ver las ventas totales
    // --- FIN CAMBIO ---
    { key: 'farmacias', label: 'Farmacias' },
    { key: 'clasificacion', label: 'Clasificación' },
    { key: 'sugerido30d', label: 'Sug. 30d', isNumeric: true },
    { key: 'sugerido40d', label: 'Sug. 40d', isNumeric: true },
    { key: 'sugerido50d', label: 'Sug. 50d', isNumeric: true },
    { key: 'sugerido60d', label: 'Sug. 60d', isNumeric: true },
    { key: 'promedio30d', label: 'Prom. 30d', isNumeric: true },
    { key: 'promedio40d', label: 'Prom. 40d', isNumeric: true },
    { key: 'promedio50d', label: 'Prom. 50d', isNumeric: true },
    { key: 'promedio60d', label: 'Prom. 60d', isNumeric: true },
  ];

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-lg">No hay productos que coincidan con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-blue-500/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`group p-3 text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-all ${col.isNumeric ? 'text-right' : 'text-left'}`} onClick={() => handleSort(col.key as keyof ConsolidatedInventoryItem)}>
                  <div className={`flex items-center gap-1 ${col.isNumeric ? 'justify-end' : ''}`}>{col.label}<SortIcon column={col.key as keyof ConsolidatedInventoryItem}/></div>
                </th>
              ))}
              {/* Encabezados para las columnas de inventario por farmacia */}
              {farmaciasUnicas.map(farmacia => (
                <th key={farmacia} className="group p-3 text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-all text-right" onClick={() => handleSort(farmacia)}>
                  <div className="flex items-center gap-1 justify-end">
                    {`Exist. ${farmacia}`}
                    <SortIcon column={farmacia}/>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {paginatedData.map((item, index) => (
              <tr key={`${item.codigo}-${index}`} className={`transition-all hover:bg-gray-800/50 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/70'}`}>
                {/* Celdas para todas tus columnas originales */}
                <td className="p-3 font-mono text-xs text-blue-300" title={item.codigo}>{item.codigo}</td>
                <td className="p-3 max-w-xs" title={item.nombres.join(', ')}><div className="truncate text-gray-200">{item.nombres.join(', ')}</div></td>
                <td className="p-3 max-w-xs" title={item.marcas.join(', ')}><div className="truncate text-gray-300">{item.marcas.join(', ')}</div></td>
                <td className="p-3 max-w-xs" title={item.departamentos.join(', ')}><div className="truncate text-gray-300">{item.departamentos.join(', ')}</div></td>
                <td className="p-3 text-right font-medium text-white">{item.existenciaActual.toLocaleString()}</td>
                {/* --- CAMBIO AÑADIDO --- */}
                <td className="p-3 text-right font-medium text-gray-300">{item.cantidad.toLocaleString()}</td>
                {/* --- FIN CAMBIO --- */}
                <td className="p-3" title={item.farmacias.join(', ')}><div className="truncate text-gray-300">{item.farmacias.join(', ')}</div></td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-full px-2 py-1 text-xs font-semibold rounded-full ${
                      item.clasificacion === 'Falla' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                      item.clasificacion === 'Exceso' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' :
                      item.clasificacion === 'No vendido' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'
                    }`}>{item.clasificacion}</span>
                </td>
                <td className="p-3 text-right font-bold text-blue-400">{item.sugerido30d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-400">{item.sugerido40d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-400">{item.sugerido50d.toLocaleString()}</td>
                <td className="p-3 text-right font-bold text-blue-400">{item.sugerido60d.toLocaleString()}</td>
                <td className="p-3 text-right text-gray-300">{item.promedio30d.toFixed(2)}</td>
                <td className="p-3 text-right text-gray-300">{item.promedio40d.toFixed(2)}</td>
                <td className="p-3 text-right text-gray-300">{item.promedio50d.toFixed(2)}</td>
                <td className="p-3 text-right text-gray-300">{item.promedio60d.toFixed(2)}</td>

                {/* Celdas para el inventario por farmacia */}
                {farmaciasUnicas.map(farmacia => (
                  <td key={farmacia} className="p-3 text-right text-white font-medium">
                    {(item.existenciasPorFarmacia[farmacia] || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Mostrar</span>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            className="border border-gray-600 bg-gray-800 text-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-600 disabled:opacity-50 hover:bg-gray-800 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 text-sm text-gray-300">
              {currentPage}
            </span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-600 disabled:opacity-50 hover:bg-gray-800 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;