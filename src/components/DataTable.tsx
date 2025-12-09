import React, { useMemo, useState, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, Settings2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConsolidatedInventoryItem, TableState, ClassificationSettings } from '../types/inventory';

// --- CELL COMPONENT (Ayuda a alinear contenido) ---
const TableCell = ({ children, align = 'left', className = '' }: { children: ReactNode, align?: 'left' | 'right', className?: string }) => (
  <div className={`px-2 py-1 flex items-center h-full ${align === 'right' ? 'justify-end' : 'justify-start'} ${className}`}>
    {children}
  </div>
);

// --- COMPACT COPY COMPONENT ---
const CopyableCell: React.FC<{ textToCopy: string; children: ReactNode }> = ({ textToCopy, children }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el click se propague a la fila si hay eventos ahí
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="group relative w-full h-full flex items-center cursor-default">
      <div className="truncate w-full">{children}</div>
      <button 
        onClick={handleCopy} 
        className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-700 p-0.5 rounded shadow-sm z-10 border border-slate-200 dark:border-slate-600"
        title="Copiar"
      >
        {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
      </button>
    </div>
  );
};

interface DataTableProps {
  data: ConsolidatedInventoryItem[];
  tableState: TableState;
  onTableStateChange: (state: TableState) => void;
  settings: ClassificationSettings;
}

const DataTable: React.FC<DataTableProps> = ({ data, tableState, onTableStateChange, settings }) => {
  const { currentPage, itemsPerPage, sortColumn, sortDirection } = tableState;
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

  // --- Lógica de Farmacias Únicas ---
  const farmaciasUnicas = useMemo(() => {
    const farmaciasSet = new Set<string>();
    data.forEach(item => Object.keys(item.existenciasPorFarmacia).forEach(f => farmaciasSet.add(f)));
    return Array.from(farmaciasSet).sort();
  }, [data]);

  // --- Definición de Columnas (Estilo Compacto) ---
  const allColumns = useMemo(() => {
    const baseColumns = [
      { key: 'codigo', label: 'CÓDIGO', minWidth: '90px', isSticky: true },
      { key: 'nombres', label: 'PRODUCTO', minWidth: '220px' },
      { key: 'marcas', label: 'MARCA', minWidth: '100px' },
      { key: 'clasificacion', label: 'ESTADO', minWidth: '90px' },
      { key: 'existenciaActual', label: 'STOCK', isNumeric: true, minWidth: '80px' },
      { key: 'cantidad', label: 'VTA 60D', isNumeric: true, minWidth: '80px' },
      { key: 'departamentos', label: 'DEPTO', minWidth: '120px' },
    ];
    settings.periodos.forEach(p => {
      baseColumns.push({ key: `sugerido${p}d`, label: `SUG.${p}D`, isNumeric: true, minWidth: '70px' });
    });
    settings.periodos.forEach(p => {
      baseColumns.push({ key: `promedio${p}d`, label: `PROM.${p}D`, isNumeric: true, minWidth: '70px' });
    });
    farmaciasUnicas.forEach(farmacia => {
      baseColumns.push({ key: farmacia, label: farmacia.toUpperCase().substring(0, 10), isNumeric: true, minWidth: '80px' });
    });
    return baseColumns;
  }, [settings.periodos, farmaciasUnicas]);

  // --- Inicializar columnas visibles ---
  useEffect(() => {
    setVisibleColumns(prev => 
      Object.keys(prev).length === 0 
        ? allColumns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}) 
        : prev
    );
  }, [allColumns]);

  const displayedColumns = useMemo(() => allColumns.filter(col => visibleColumns[col.key]), [allColumns, visibleColumns]);

  const handleToggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Ordenamiento ---
  const handleSort = (column: string) => {
    const newDirection = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    onTableStateChange({ ...tableState, sortColumn: column as any, sortDirection: newDirection, currentPage: 1 });
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

  // --- Paginación ---
  const totalItems = sortedData.length;
  const displayItemsPerPage = itemsPerPage === 0 ? totalItems : itemsPerPage;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / displayItemsPerPage);
  
  const paginatedData = useMemo(() => {
    if (itemsPerPage === 0) return sortedData;
    return sortedData.slice((currentPage - 1) * displayItemsPerPage, currentPage * displayItemsPerPage);
  }, [sortedData, currentPage, displayItemsPerPage]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400 text-sm">No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      
      {/* Barra superior compacta para selector de columnas */}
      <div className="flex justify-end px-2 py-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
         <div className="relative">
            <button 
              onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} 
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" 
              title="Columnas"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {isColumnSelectorOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-50">
                <div className="p-2 border-b border-slate-200 dark:border-slate-700"><h4 className="font-semibold text-xs text-slate-700 dark:text-slate-200">Mostrar Columnas</h4></div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {allColumns.map(col => (
                    <label key={col.key} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[col.key] || false} 
                        onChange={() => handleToggleColumn(col.key)} 
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Contenedor Scrollable */}
      <div className="flex-1 overflow-auto scrollbar-thin relative">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
            <tr>
              {displayedColumns.map((col) => (
                <th 
                  key={col.key} 
                  onClick={() => handleSort(col.key)}
                  className={`
                    sticky top-0 bg-slate-100 dark:bg-slate-800
                    p-0 border-r border-b border-slate-300 dark:border-slate-600 
                    text-[10px] font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors
                    ${(col as any).isSticky ? 'sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}
                  `}
                  style={{ minWidth: col.minWidth, width: col.minWidth }}
                >
                  <div className={`px-2 py-1.5 flex items-center gap-1 ${col.isNumeric ? 'justify-end' : 'justify-start'}`}>
                    {col.label}
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedData.map((item, index) => (
              <tr 
                key={`${item.codigo}-${index}`} 
                className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors odd:bg-white even:bg-slate-50/30 dark:odd:bg-slate-900 dark:even:bg-slate-800/30"
              >
                {displayedColumns.map((col) => {
                  const val = (item as any)[col.key];
                  let content;
                  
                  if (col.key === 'codigo') {
                    content = <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{val}</span>;
                  } else if (col.key === 'clasificacion') {
                    const color = val === 'Falla' ? 'text-red-600 bg-red-50 dark:bg-red-900/30' : 
                                  val === 'Exceso' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' :
                                  val === 'No vendido' ? 'text-slate-500' : 'text-green-600 bg-green-50 dark:bg-green-900/30';
                    content = <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-transparent ${color}`}>{val}</span>;
                  } else if (col.isNumeric) {
                    if (farmaciasUnicas.includes(col.key)) {
                       const stock = item.existenciasPorFarmacia[col.key] || 0;
                       content = <span className={stock === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'}>{stock}</span>;
                    } else if (col.key.startsWith('sugerido')) {
                       content = <span className="font-bold text-blue-600 dark:text-blue-400">{val?.toLocaleString() || 0}</span>;
                    } else {
                       content = val?.toLocaleString();
                    }
                  } else {
                    content = Array.isArray(val) ? val.join(', ') : val;
                  }

                  return (
                    <td 
                      key={col.key} 
                      className={`
                        p-0 border-r border-slate-200 dark:border-slate-700 text-xs tabular-nums
                        ${(col as any).isSticky ? 'sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}
                      `}
                    >
                      <TableCell align={col.isNumeric ? 'right' : 'left'}>
                        <CopyableCell textToCopy={String(val)}>{content}</CopyableCell>
                      </TableCell>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación Compacta */}
      <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-3 py-1.5 flex justify-between items-center text-xs select-none">
        <div className="flex items-center gap-4 text-slate-500">
           <span>{totalItems.toLocaleString()} Items</span>
           <select 
             value={itemsPerPage} 
             onChange={(e) => onTableStateChange({ ...tableState, itemsPerPage: Number(e.target.value), currentPage: 1 })}
             className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
           >
             <option value="50">50 filas</option>
             <option value="100">100 filas</option>
             <option value="500">500 filas</option>
             <option value="0">Todos</option>
           </select>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onTableStateChange({ ...tableState, currentPage: Math.max(1, currentPage - 1) })}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Anterior
          </button>
          <span className="text-slate-600 dark:text-slate-400 px-2">
             Pag {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => onTableStateChange({ ...tableState, currentPage: Math.min(totalPages, currentPage + 1) })}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Siguiente
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;