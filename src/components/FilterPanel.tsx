import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { FilterState, ConsolidatedInventoryItem } from '../types/inventory';

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
  isOpen: boolean;
  onToggle: () => void;
  countMap: Map<string, number>;
  isSearchable?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, values, selected, onChange, isOpen, onToggle, countMap, isSearchable = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const filteredValues = useMemo(() => {
    if (!isSearchable || !searchTerm) {
      return values;
    }
    return values.filter(value =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [values, searchTerm, isSearchable]);

  const handleSelectAll = () => {
    const allFilteredSelected = filteredValues.every(v => selected.includes(v));
    if (allFilteredSelected) {
      onChange(selected.filter(v => !filteredValues.includes(v)));
    } else {
      onChange([...new Set([...selected, ...filteredValues])]);
    }
  };

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-all">
        <span className="font-medium text-gray-200">{title}</span>
        <div className="flex items-center space-x-2">
          {selected.length > 0 && <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/50">{selected.length}</span>}
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3">
          {isSearchable && (
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-600 bg-gray-800 text-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          <div className="mb-3">
            <button onClick={handleSelectAll} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {filteredValues.length > 0 ? 'Seleccionar/Deseleccionar todo' : 'Sin resultados'}
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition-all">
                <input type="checkbox" checked={selected.includes(value)} onChange={() => handleToggle(value)} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"/>
                <span className="text-sm text-gray-300 flex-1 truncate" title={value}>{value}</span>
                <span className="text-xs text-gray-500">{countMap.get(value)?.toLocaleString() || 0}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFilterChange }) => {
  const [openSections, setOpenSections] = useState({ farmacia: true, departamento: true, marca: false, clasificacion: true });

  const toggleSection = (section: keyof typeof openSections) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  const useMemoizedFilterData = (field: keyof ConsolidatedInventoryItem) => {
    return useMemo(() => {
      const values = new Set<string>();
      const counts = new Map<string, number>();
      
      data.forEach(item => {
        const itemValue = item[field];
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
  const hasActiveFilters = () => Object.values(filters).some(arr => arr.length > 0);

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-blue-500/30 rounded-xl">
        <div className="p-4 border-b border-gray-800 flex items-center space-x-2"><Filter className="h-5 w-5 text-blue-400" /><h2 className="font-semibold text-gray-100">Filtros</h2></div>
        <div className="p-4 text-center text-gray-400">Carga archivos para ver los filtros.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-blue-500/30 rounded-xl">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2"><Filter className="h-5 w-5 text-blue-400" /><h2 className="font-semibold text-gray-100">Filtros</h2></div>
        {hasActiveFilters() && <button onClick={clearAllFilters} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Limpiar</button>}
      </div>
      <div className="divide-y divide-gray-800">
        <FilterSection title="Clasificación" values={clasificacionData.uniqueValues} selected={filters.clasificacion} onChange={(s) => onFilterChange({ ...filters, clasificacion: s })} isOpen={openSections.clasificacion} onToggle={() => toggleSection('clasificacion')} countMap={clasificacionData.valueCounts} />
        <FilterSection title="Farmacia" values={farmaciaData.uniqueValues} selected={filters.farmacia} onChange={(s) => onFilterChange({ ...filters, farmacia: s })} isOpen={openSections.farmacia} onToggle={() => toggleSection('farmacia')} countMap={farmaciaData.valueCounts} />
        <FilterSection title="Departamento" values={departamentoData.uniqueValues} selected={filters.departamento} onChange={(s) => onFilterChange({ ...filters, departamento: s })} isOpen={openSections.departamento} onToggle={() => toggleSection('departamento')} countMap={departamentoData.valueCounts} isSearchable={true} />
        <FilterSection title="Marca" values={marcaData.uniqueValues} selected={filters.marca} onChange={(s) => onFilterChange({ ...filters, marca: s })} isOpen={openSections.marca} onToggle={() => toggleSection('marca')} countMap={marcaData.valueCounts} isSearchable={true} />
      </div>
    </div>
  );
};

export default FilterPanel;