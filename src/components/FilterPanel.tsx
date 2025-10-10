import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterState, InventoryItem } from '../types/inventory';

interface FilterPanelProps {
  data: InventoryItem[];
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
  data: InventoryItem[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  values,
  selected,
  onChange,
  isOpen,
  onToggle,
  data
}) => {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === values.length) {
      onChange([]);
    } else {
      onChange(values);
    }
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800">{title}</span>
        <div className="flex items-center space-x-2">
          {selected.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {selected.length}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="mb-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selected.length === values.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {values.map(value => (
              <label
                key={value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(value)}
                  onChange={() => handleToggle(value)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1 truncate" title={value}>
                  {value}
                </span>
                <span className="text-xs text-gray-500">
                  {data.filter(item => {
                    switch (title) {
                      case 'Farmacia': return item.farmacia === value;
                      case 'Departamento': return item.departamento === value;
                      case 'Marca': return item.marca === value;
                      case 'Clasificación': return item.clasificacion === value;
                      default: return false;
                    }
                  }).length}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFilterChange }) => {
  const [openSections, setOpenSections] = React.useState({
    farmacia: true,
    departamento: true,
    marca: false,
    clasificacion: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getUniqueValues = (field: keyof InventoryItem): string[] => {
    return Array.from(new Set(data.map(item => String(item[field])))).sort();
  };

  const clearAllFilters = () => {
    onFilterChange({
      farmacia: [],
      departamento: [],
      marca: [],
      clasificacion: []
    });
  };

  const hasActiveFilters = () => {
    return filters.farmacia.length > 0 || 
           filters.departamento.length > 0 || 
           filters.marca.length > 0 || 
           filters.clasificacion.length > 0;
  };

  if (data.length === 0) {
    return (
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Filtros</h2>
          </div>
        </div>
        <div className="p-4 text-center text-gray-500">
          Carga archivos para ver los filtros disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Filtros</h2>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        <FilterSection
          title="Farmacia"
          values={getUniqueValues('farmacia')}
          selected={filters.farmacia}
          onChange={(selected) => onFilterChange({ ...filters, farmacia: selected })}
          isOpen={openSections.farmacia}
          onToggle={() => toggleSection('farmacia')}
          data={data}
        />
        
        <FilterSection
          title="Departamento"
          values={getUniqueValues('departamento')}
          selected={filters.departamento}
          onChange={(selected) => onFilterChange({ ...filters, departamento: selected })}
          isOpen={openSections.departamento}
          onToggle={() => toggleSection('departamento')}
          data={data}
        />
        
        <FilterSection
          title="Marca"
          values={getUniqueValues('marca')}
          selected={filters.marca}
          onChange={(selected) => onFilterChange({ ...filters, marca: selected })}
          isOpen={openSections.marca}
          onToggle={() => toggleSection('marca')}
          data={data}
        />
        
        <FilterSection
          title="Clasificación"
          values={getUniqueValues('clasificacion')}
          selected={filters.clasificacion}
          onChange={(selected) => onFilterChange({ ...filters, clasificacion: selected })}
          isOpen={openSections.clasificacion}
          onToggle={() => toggleSection('clasificacion')}
          data={data}
        />
      </div>
    </div>
  );
};

export default FilterPanel;