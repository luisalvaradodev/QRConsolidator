import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, X, CheckSquare, Square } from 'lucide-react';
import { FilterState, ConsolidatedInventoryItem } from '../types/inventory';

// Definición de Props
interface FilterPanelProps {
  data: ConsolidatedInventoryItem[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterSectionProps {
  title: string;
  values: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  countMap: Map<string, number>;
  isSearchable?: boolean;
}

// --- COMPONENTE DE SECCIÓN COMPACTO ---
const FilterSection: React.FC<FilterSectionProps> = ({ 
  title, 
  values, 
  selected, 
  onChange, 
  countMap, 
  isSearchable = false 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtrado
  const filteredValues = useMemo(() => {
    if (!isSearchable || !searchTerm) return values;
    return values.filter((v) => v.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [values, searchTerm, isSearchable]);

  const allSelected = filteredValues.length > 0 && filteredValues.every((v) => selected.includes(v));

  // Manejadores de eventos
  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter((v) => !filteredValues.includes(v)));
    } else {
      onChange([...new Set([...selected, ...filteredValues])]);
    }
  };

  const toggleItem = (value: string) => {
    onChange(
      selected.includes(value) 
        ? selected.filter((v) => v !== value) 
        : [...selected, value]
    );
  };

  return (
    <div className="border-b border-slate-300 dark:border-slate-700 last:border-b-0">
      {/* Cabecera del Acordeón */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between py-2 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 rounded-sm">
              {selected.length}
            </span>
          )}
          <ChevronDown 
            size={14} 
            className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          />
        </div>
      </button>
      
      {/* Contenido Desplegable */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-950 pb-2">
          {/* Barra de Búsqueda */}
          {isSearchable && (
            <div className="relative px-2 py-1.5 border-b border-slate-200 dark:border-slate-800">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Lista de Items */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin px-1 py-1 space-y-0.5">
            {values.length > 5 && (
              <button 
                onClick={toggleAll} 
                className="flex items-center w-full text-left px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-sm transition-colors"
              >
                {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>
            )}

            {filteredValues.map((value) => {
              const isSelected = selected.includes(value);
              return (
                <label 
                  key={value} 
                  className={`flex items-center justify-between px-2 py-1 rounded-sm cursor-pointer group transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected ? (
                      <CheckSquare size={14} className="text-blue-600 dark:text-blue-500 shrink-0" />
                    ) : (
                      <Square size={14} className="text-slate-400 group-hover:text-slate-500 shrink-0" />
                    )}
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleItem(value)} 
                      className="hidden" 
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate" title={value}>
                      {value}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-500 ml-2">
                    {countMap.get(value) || 0}
                  </span>
                </label>
              );
            })}
            
            {filteredValues.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFilterChange }) => {
  
  // Hook personalizado para procesar los datos (Memoized)
  const useMemoizedFilterData = (field: keyof ConsolidatedInventoryItem | keyof ConsolidatedInventoryItem[]) => {
    return useMemo(() => {
      const values = new Set<string>();
      const counts = new Map<string, number>();
      
      data.forEach(item => {
        const itemValue = item[field as keyof ConsolidatedInventoryItem];
        
        if (Array.isArray(itemValue)) {
          itemValue.forEach(v => {
            if(v) {
              values.add(String(v));
              counts.set(String(v), (counts.get(String(v)) || 0) + 1);
            }
          });
        } else if (itemValue) {
          values.add(String(itemValue));
          counts.set(String(itemValue), (counts.get(String(itemValue)) || 0) + 1);
        }
      });

      return { 
        uniqueValues: Array.from(values).sort((a,b) => a.localeCompare(b)), 
        valueCounts: counts 
      };
    }, [data, field]);
  };

  const farmaciaData = useMemoizedFilterData('farmacias');
  const departamentoData = useMemoizedFilterData('departamentos');
  const marcaData = useMemoizedFilterData('marcas');
  const clasificacionData = useMemoizedFilterData('clasificacion');
   
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
      <FilterSection 
        title="Estado" // Cambiado de "Clasificación" a "Estado" según el diseño nuevo
        values={clasificacionData.uniqueValues} 
        selected={filters.clasificacion} 
        onChange={(s) => onFilterChange({ ...filters, clasificacion: s })} 
        countMap={clasificacionData.valueCounts} 
      />
      <FilterSection 
        title="Farmacia" 
        values={farmaciaData.uniqueValues} 
        selected={filters.farmacia} 
        onChange={(s) => onFilterChange({ ...filters, farmacia: s })} 
        countMap={farmaciaData.valueCounts} 
        isSearchable={true} 
      />
      <FilterSection 
        title="Departamento" 
        values={departamentoData.uniqueValues} 
        selected={filters.departamento} 
        onChange={(s) => onFilterChange({ ...filters, departamento: s })} 
        countMap={departamentoData.valueCounts} 
        isSearchable={true} 
      />
      <FilterSection 
        title="Marca" 
        values={marcaData.uniqueValues} 
        selected={filters.marca} 
        onChange={(s) => onFilterChange({ ...filters, marca: s })} 
        countMap={marcaData.valueCounts} 
        isSearchable={true} 
      />
      
      {hasActiveFilters && (
        <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700">
          <button 
            onClick={() => onFilterChange({ farmacia: [], departamento: [], marca: [], clasificacion: [] })} 
            className="w-full flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded-sm transition-colors"
          >
            <X size={14} /> 
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;