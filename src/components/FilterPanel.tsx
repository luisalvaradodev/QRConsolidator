import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, values, selected, onChange, isOpen, onToggle, countMap }) => {
  const handleToggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const handleSelectAll = () => onChange(selected.length === values.length ? [] : values);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <span className="font-medium text-gray-800">{title}</span>
        <div className="flex items-center space-x-2">
          {selected.length > 0 && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{selected.length}</span>}
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="mb-3">
            <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {selected.length === values.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {values.map(value => (
              <label key={value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input type="checkbox" checked={selected.includes(value)} onChange={() => handleToggle(value)} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
                <span className="text-sm text-gray-700 flex-1 truncate" title={value}>{value}</span>
                <span className="text-xs text-gray-500">{countMap.get(value) || 0}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFilterChange }) => {
  const [openSections, setOpenSections] = React.useState({ farmacia: true, departamento: true, marca: false, clasificacion: true });

  const toggleSection = (section: keyof typeof openSections) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  const useMemoizedFilterData = (field: keyof ConsolidatedInventoryItem) => {
    return React.useMemo(() => {
      const values = new Set<string>();
      const counts = new Map<string, number>();
      
      data.forEach(item => {
        const itemValue = item[field];
        if (Array.isArray(itemValue)) {
          itemValue.forEach(v => {
            const val = String(v).split(/[-_]/).pop()?.trim() || String(v); // Limpia el nombre de farmacia
            values.add(val);
            counts.set(val, (counts.get(val) || 0) + 1);
          });
        } else {
          const val = String(itemValue);
          values.add(val);
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      });

      return { uniqueValues: Array.from(values).sort(), valueCounts: counts };
    }, [data, field]);
  };

  const farmaciaData = useMemoizedFilterData('farmacias');
  const departamentoData = useMemoizedFilterData('departamento');
  const marcaData = useMemoizedFilterData('marca');
  const clasificacionData = useMemoizedFilterData('clasificacion');

  const clearAllFilters = () => onFilterChange({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
  const hasActiveFilters = () => Object.values(filters).some(arr => arr.length > 0);

  if (data.length === 0) {
    return (
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center space-x-2"><Filter className="h-5 w-5 text-gray-500" /><h2 className="font-semibold text-gray-800">Filtros</h2></div>
        <div className="p-4 text-center text-gray-500">Carga archivos para ver los filtros.</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2"><Filter className="h-5 w-5 text-gray-500" /><h2 className="font-semibold text-gray-800">Filtros</h2></div>
        {hasActiveFilters() && <button onClick={clearAllFilters} className="text-sm text-gray-500 hover:text-gray-700">Limpiar</button>}
      </div>
      <div className="divide-y divide-gray-200">
        <FilterSection title="Farmacia (Listado)" values={farmaciaData.uniqueValues} selected={filters.farmacia} onChange={(s) => onFilterChange({ ...filters, farmacia: s })} isOpen={openSections.farmacia} onToggle={() => toggleSection('farmacia')} countMap={farmaciaData.valueCounts} />
        <FilterSection title="Departamento" values={departamentoData.uniqueValues} selected={filters.departamento} onChange={(s) => onFilterChange({ ...filters, departamento: s })} isOpen={openSections.departamento} onToggle={() => toggleSection('departamento')} countMap={departamentoData.valueCounts} />
        <FilterSection title="Marca" values={marcaData.uniqueValues} selected={filters.marca} onChange={(s) => onFilterChange({ ...filters, marca: s })} isOpen={openSections.marca} onToggle={() => toggleSection('marca')} countMap={marcaData.valueCounts} />
        <FilterSection title="Clasificación" values={clasificacionData.uniqueValues} selected={filters.clasificacion} onChange={(s) => onFilterChange({ ...filters, clasificacion: s })} isOpen={openSections.clasificacion} onToggle={() => toggleSection('clasificacion')} countMap={clasificacionData.valueCounts} />
      </div>
    </div>
  );
};

export default FilterPanel;