import React, { useMemo, useState, useRef, useEffect, ReactNode } from 'react';
// Asegúrate de importar los nuevos iconos: Copy y Check
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2, Copy, Check } from 'lucide-react';
import { ConsolidatedInventoryItem, TableState, ClassificationSettings } from '../types/inventory';

// --- NUEVO COMPONENTE REUTILIZABLE PARA COPIAR ---
interface CopyableCellProps {
  textToCopy: string;
  children: ReactNode;
}

const CopyableCell: React.FC<CopyableCellProps> = ({ textToCopy, children }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (isCopied) return; // Evitar múltiples clicks
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Resetear el ícono después de 2 segundos
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    // 'group' permite que el hover sobre este div afecte a sus hijos (el botón de copiar)
    <div className="group relative w-full h-full flex items-center">
      <div className="flex-grow">{children}</div>
      <button
        onClick={handleCopy}
        className="
         absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-md bg-slate-200/50 dark:bg-slate-700/50
         opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200
        "
        aria-label="Copiar al portapapeles"
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />
        )}
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

const TooltipCell: React.FC<{ text: string; lineClamp?: number }> = ({ text, lineClamp = 1 }) => (
  <div title={text} className={lineClamp === 1 ? 'truncate' : `line-clamp-${lineClamp}`}>
    {text}
  </div>
);

const DataTable: React.FC<DataTableProps> = ({ data, tableState, onTableStateChange, settings }) => {
  const { currentPage, itemsPerPage, sortColumn, sortDirection } = tableState;
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [tableWidth, setTableWidth] = useState(0);

  const farmaciasUnicas = useMemo(() => {
    const farmaciasSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item.existenciasPorFarmacia).forEach(farmacia => farmaciasSet.add(farmacia));
    });
    return Array.from(farmaciasSet).sort();
  }, [data]);

  const allColumns = useMemo(() => {
    const baseColumns = [
      { key: 'codigo', label: 'Código', minWidth: '120px' },
      { key: 'nombres', label: 'Nombre del Producto', minWidth: '320px' },
      { key: 'marcas', label: 'Marca', minWidth: '180px' },
      { key: 'departamentos', label: 'Departamento', minWidth: '180px' },
      { key: 'existenciaActual', label: 'Stock Total', isNumeric: true, minWidth: '120px' },
      { key: 'cantidad', label: 'Vendido 60d', isNumeric: true, minWidth: '120px' },
      { key: 'clasificacion', label: 'Clasificación', minWidth: '130px' },
      { key: 'cantidadConsolidada', label: 'Cantidad Consolidada', isNumeric: true, minWidth: '280px' }, 
    ];
    settings.periodos.forEach(p => {
      baseColumns.push({ key: `sugerido${p}d`, label: `Sugerido ${p}d`, isNumeric: true, minWidth: '120px' });
    });
    settings.periodos.forEach(p => {
      baseColumns.push({ key: `promedio${p}d`, label: `Promedio ${p}d`, isNumeric: true, minWidth: '120px' });
    });
    farmaciasUnicas.forEach(farmacia => {
      baseColumns.push({ key: farmacia, label: `Stock ${farmacia}`, isNumeric: true, minWidth: '120px' });
    });
    return baseColumns;
  }, [settings.periodos, farmaciasUnicas]);

  useEffect(() => {
    setVisibleColumns(allColumns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}));
  }, [allColumns]);

  const displayedColumns = useMemo(() => {
    return allColumns.filter(col => visibleColumns[col.key]);
  }, [allColumns, visibleColumns]);

  const handleToggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (column: keyof ConsolidatedInventoryItem | string) => {
    const newDirection = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
    onTableStateChange({ ...tableState, sortColumn: column as any, sortDirection: newDirection, currentPage: 1 });
  };
  
  const handlePageChange = (page: number) => onTableStateChange({ ...tableState, currentPage: page });

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTableStateChange({ ...tableState, itemsPerPage: Number(e.target.value), currentPage: 1 });
  };
  
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const isFarmaciaColumn = farmaciasUnicas.includes(sortColumn as string);
      const aVal = isFarmaciaColumn ? a.existenciasPorFarmacia[sortColumn as string] || 0 : a[sortColumn as keyof ConsolidatedInventoryItem];
      const bVal = isFarmaciaColumn ? b.existenciasPorFarmacia[sortColumn as string] || 0 : b[sortColumn as keyof ConsolidatedInventoryItem];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      const aStr = Array.isArray(aVal) ? aVal.join(', ') : String(aVal || '');
      const bStr = Array.isArray(bVal) ? bVal.join(', ') : String(bVal || '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection, farmaciasUnicas]);
  
  const totalItems = sortedData.length;
  const displayItemsPerPage = itemsPerPage === 0 ? totalItems : itemsPerPage;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / displayItemsPerPage);

  const paginatedData = useMemo(() => sortedData.slice(
    (currentPage - 1) * displayItemsPerPage, 
    currentPage * displayItemsPerPage
  ), [sortedData, currentPage, displayItemsPerPage]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500 dark:text-blue-400" /> 
      : <ChevronDown className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
  };

  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;
    const table = tableRef.current;
    if (!topScroll || !bottomScroll) return;
    
    // Función para actualizar el ancho de la scrollbar superior
    const updateScrollbarWidth = () => {
      if (table) {
        const tableWidth = table.scrollWidth;
        setTableWidth(tableWidth);
      }
    };
    
    // Actualizar ancho inicial
    updateScrollbarWidth();
    
    // Observer para detectar cambios en el tamaño de la tabla
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    if (table) {
      resizeObserver.observe(table);
    }
    
    const handleTopScroll = () => bottomScroll.scrollLeft = topScroll.scrollLeft;
    const handleBottomScroll = () => topScroll.scrollLeft = bottomScroll.scrollLeft;
    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);
    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      resizeObserver.disconnect();
    };
  }, [displayedColumns]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-lg">No hay productos que coincidan.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollbar superior y selector de columnas */}
      <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div ref={topScrollRef} className="overflow-x-auto flex-grow scrollbar-hide">
            <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
          </div>
          <div className="relative pl-4">
            <button onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" title="Seleccionar columnas">
              <Settings2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            {isColumnSelectorOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border rounded-lg shadow-xl z-20">
                <div className="p-3 border-b"><h4 className="font-semibold text-sm">Mostrar Columnas</h4></div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {allColumns.map(col => (
                    <label key={col.key} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                      <input type="checkbox" checked={visibleColumns[col.key] || false} onChange={() => handleToggleColumn(col.key)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenedor de la tabla */}
      <div ref={bottomScrollRef} className="flex-1 overflow-auto">
        <table ref={tableRef} className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              {displayedColumns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} className="group px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 border-r last:border-r-0" style={{ minWidth: col.minWidth }}>
                  <div className={`flex items-center gap-2 ${col.isNumeric ? 'justify-end' : ''}`}>
                    <span>{col.label}</span><SortIcon column={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedData.map((item, index) => (
              <tr key={`${item.codigo}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {displayedColumns.map(col => (
                  <td key={col.key} className={`px-4 py-2.5 border-r last:border-r-0 ${col.isNumeric ? 'text-right' : ''}`}>
                    {(() => {
                        const value = (item as any)[col.key];
                        switch (col.key) {
                          case 'codigo': return <CopyableCell textToCopy={item.codigo}><div className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">{item.codigo}</div></CopyableCell>;
                          case 'nombres': return <CopyableCell textToCopy={item.nombres.join(', ')}><div className="text-sm font-medium text-slate-900 dark:text-slate-100"><TooltipCell text={item.nombres.join(', ')} lineClamp={2} /></div></CopyableCell>;
                          case 'marcas': return <CopyableCell textToCopy={item.marcas.join(', ')}><div className="text-sm text-slate-600 dark:text-slate-300"><TooltipCell text={item.marcas.join(', ')} /></div></CopyableCell>;
                          case 'departamentos': return <CopyableCell textToCopy={item.departamentos.join(', ')}><div className="text-sm text-slate-600 dark:text-slate-300"><TooltipCell text={item.departamentos.join(', ')} /></div></CopyableCell>;
                          case 'existenciaActual': return <CopyableCell textToCopy={item.existenciaActual.toString()}><div className="text-sm font-semibold">{item.existenciaActual.toLocaleString()}</div></CopyableCell>;
                          case 'cantidad': return <CopyableCell textToCopy={item.cantidad.toString()}><div className="text-sm text-slate-600 dark:text-slate-300">{item.cantidad.toLocaleString()}</div></CopyableCell>;
                          case 'clasificacion': return <CopyableCell textToCopy={item.clasificacion}><span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${item.clasificacion === 'Falla' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : item.clasificacion === 'Exceso' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' : item.clasificacion === 'No vendido' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'}`}>{item.clasificacion}</span></CopyableCell>;
                          
                          // --- INICIO DE LA MODIFICACIÓN ---
                          case 'cantidadConsolidada': {
                            // 1. Obtener todas las sugerencias positivas
                            const sugeridosList = settings.periodos
                              .map(p => ({ 
                                  dias: p, 
                                  cantidad: item[`sugerido${p}d`] || 0 
                              }))
                              .filter(s => s.cantidad > 0);
                            
                            // 2. Formatear la lista de sugerencias
                            const sugeridosString = sugeridosList.length > 0
                              ? `Sugeridos: [${sugeridosList.map(s => `${s.cantidad} (p/${s.dias}d)`).join(', ')}]`
                              : "Sugeridos: [Ninguno]";
                            
                            // 3. Obtener las cantidades específicas por clasificación
                            const cantFalla = item.clasificacion === 'Falla' ? item.cantidadConsolidada : 0;
                            const cantExceso = item.clasificacion === 'Exceso' ? item.cantidadConsolidada : 0;
                            const cantNoVendido = item.clasificacion === 'No vendido' ? item.cantidadConsolidada : 0;
                            const cantOK = item.clasificacion === 'OK' ? item.cantidadConsolidada : 0;
                            
                            // 4. Create pharmacy breakdown string
                            const farmacyStockString = Object.entries(item.existenciasPorFarmacia)
                              .map(([farmacia, stock]) => `${farmacia}: ${stock || 0}`)
                              .join(' | ');

                            // 5. [NUEVO] Create Total Stock string
                            const totalStockString = `Stock Total: ${item.existenciaActual.toLocaleString()}`;
                            
                            // 6. Construir el string de texto para copiar
                            const summaryText = `
Producto: ${item.nombres.join(', ')}
ID: ${item.codigo}
---
Stock por Farmacia: ${farmacyStockString}
${totalStockString}
---
Clasificación: ${item.clasificacion}
---
Cant. Falla: ${cantFalla.toLocaleString()}
Cant. Exceso: ${cantExceso.toLocaleString()}
Cant. No Vendido: ${cantNoVendido.toLocaleString()}
Cant. OK (Sugerido): ${cantOK.toLocaleString()}
---
${sugeridosString}
                            `.trim().replace(/^\s+/gm, ''); // Limpiar espacios
                    
                            // 7. Construir el JSX para mostrar en la celda
                            const displayJsx = (
                              <div className="text-left text-xs whitespace-pre-wrap leading-relaxed py-1">
                                
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {farmacyStockString}
                                </div>

                                {/* ESTA ES LA LÍNEA QUE FALTABA */}
                                <div className="font-bold text-sm mt-1 text-slate-900 dark:text-slate-100">
                                  {totalStockString}
                                </div>

                                <div className={`font-bold text-sm mt-1 ${
                                  item.clasificacion === 'Falla' ? 'text-red-600 dark:text-red-400' :
                                  item.clasificacion === 'Exceso' ? 'text-yellow-600 dark:text-yellow-400' :
                                  item.clasificacion === 'No vendido' ? 'text-slate-600 dark:text-slate-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {/* Este es el número de ACCIÓN */}
                                  {item.cantidadConsolidada.toLocaleString()} 
                                  <span className="font-medium text-slate-600 dark:text-slate-400"> ({item.clasificacion})</span>
                                </div>
                                <div className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                                  ID: {item.codigo}
                                </div>
                                <div className="mt-1 text-slate-600 dark:text-slate-400">
                                  {sugeridosString}
                                </div>
                              </div>
                            );
                            
                            // 8. Devolver el componente CopyableCell
                            return (
                              <CopyableCell textToCopy={summaryText}>
                                {displayJsx}
                              </CopyableCell>
                            );
                          }
                          // --- FIN DE LA MODIFICACIÓN ---

                          default:
                            if (col.key.startsWith('sugerido')) return <CopyableCell textToCopy={(value || '0').toString()}><div className="text-sm font-bold text-blue-600 dark:text-blue-400">{value?.toLocaleString() || '0'}</div></CopyableCell>;
                            if (col.key.startsWith('promedio')) return <CopyableCell textToCopy={(value || 0).toFixed(1)}><div className="text-sm text-slate-500 dark:text-slate-400">{value?.toFixed(1) || '0.0'}</div></CopyableCell>;
                            if (farmaciasUnicas.includes(col.key)) {
                              const stock = item.existenciasPorFarmacia[col.key] || 0;
                              return <CopyableCell textToCopy={stock.toString()}><div className="text-sm font-medium">{stock.toLocaleString()}</div></CopyableCell>;
                            }
                            return <CopyableCell textToCopy={String(value)}><div className="text-sm">{String(value)}</div></CopyableCell>;
                        }
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      <div className="bg-white dark:bg-slate-800 border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mostrar:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>Todos</option>
              </select>
            </div>
            
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Mostrando {((currentPage - 1) * displayItemsPerPage) + 1} a {Math.min(currentPage * displayItemsPerPage, totalItems)} de {totalItems.toLocaleString()} productos
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;