import React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, XCircle } from 'lucide-react';
import { FilterState, ConsolidatedInventoryItem } from '../types/inventory';

interface FilterPanelProps {
  data: ConsolidatedInventoryItem[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

// --- SUBCOMPONENTE MEJORADO: FilterSection ---
interface FilterSectionProps {
  title: string;
  values: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  countMap: Map<string, number>;
  isSearchable?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, values, selected, onChange, countMap, isSearchable = false }) => {
  const [isOpen, setIsOpen] = useState(true); // Secciones abiertas por defecto para mayor accesibilidad
  const [searchTerm, setSearchTerm] = useState('');
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const filteredValues = useMemo(() => {
    if (!isSearchable || !searchTerm) return values;
    return values.filter(value => value.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [values, searchTerm, isSearchable]);

  const allFilteredSelected = useMemo(() => {
    return filteredValues.length > 0 && filteredValues.every(v => selected.includes(v));
  }, [filteredValues, selected]);
  
  const someFilteredSelected = useMemo(() => {
    return filteredValues.some(v => selected.includes(v)) && !allFilteredSelected;
  }, [filteredValues, selected, allFilteredSelected]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      onChange(selected.filter(v => !filteredValues.includes(v)));
    } else {
      onChange([...new Set([...selected, ...filteredValues])]);
    }
  };
  
  const handleItemToggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        <div className="flex items-center space-x-2">
          {selected.length > 0 && <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">{selected.length}</span>}
          <ChevronDown className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isOpen && "rotate-180"}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20">
          {isSearchable && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={`Buscar en ${title}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {values.length > 5 && (
              <label className="flex items-center space-x-3 cursor-pointer py-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  ref={selectAllCheckboxRef}
                  checked={allFilteredSelected} 
                  onChange={handleSelectAllToggle}
                  className="h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"
                />
                <span>{allFilteredSelected ? "Deseleccionar todo" : "Seleccionar todo"}</span>
              </label>
            )}

            {filteredValues.map(value => (
              <label key={value} className="flex items-center justify-between w-full space-x-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/60 p-2 rounded-md transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <input type="checkbox" checked={selected.includes(value)} onChange={() => handleItemToggle(value)} className="h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"/>
                  
                  {/* --- SOLUCIÓN TOOLTIP PARA NOMBRES LARGOS --- */}
                  <div className="relative group min-w-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300 block truncate">{value}</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                      {value}
                    </div>
                  </div>

                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{countMap.get(value)?.toLocaleString() || 0}</span>
              </label>
            ))}
            {filteredValues.length === 0 && <p className="text-sm text-center text-slate-500 p-2">Sin resultados.</p>}
          </div>
        </div>
      )}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL MEJORADO: FilterPanel ---
const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFilterChange }) => {

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

      return { uniqueValues: Array.from(values).sort((a,b) => a.localeCompare(b)), valueCounts: counts };
    }, [data, field]);
  };

  const farmaciaData = useMemoizedFilterData('farmacias');
  const departamentoData = useMemoizedFilterData('departamentos');
  const marcaData = useMemoizedFilterData('marcas');
  const clasificacionData = useMemoizedFilterData('clasificacion');

  const clearAllFilters = () => onFilterChange({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  if (data.length === 0) {
    return null; // En el nuevo layout, es mejor no mostrar nada si no hay datos.
  }

  return (
    // Ya no necesita su propia tarjeta, porque se anida en una en App.tsx
    <>
      <FilterSection title="Clasificación" values={clasificacionData.uniqueValues} selected={filters.clasificacion} onChange={(s) => onFilterChange({ ...filters, clasificacion: s })} countMap={clasificacionData.valueCounts} />
      <FilterSection title="Farmacia" values={farmaciaData.uniqueValues} selected={filters.farmacia} onChange={(s) => onFilterChange({ ...filters, farmacia: s })} countMap={farmaciaData.valueCounts} isSearchable={true} />
      <FilterSection title="Departamento" values={departamentoData.uniqueValues} selected={filters.departamento} onChange={(s) => onFilterChange({ ...filters, departamento: s })} countMap={departamentoData.valueCounts} isSearchable={true} />
      <FilterSection title="Marca" values={marcaData.uniqueValues} selected={filters.marca} onChange={(s) => onFilterChange({ ...filters, marca: s })} countMap={marcaData.valueCounts} isSearchable={true} />
      
      {hasActiveFilters && (
        <div className="p-3 mt-2">
          <button 
            onClick={clearAllFilters} 
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 transition-colors font-semibold bg-slate-100 hover:bg-red-100 dark:bg-slate-800/50 dark:hover:bg-red-900/30 py-2 rounded-lg"
          >
            <XCircle size={16} />
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </>
  );
};

export default FilterPanel;