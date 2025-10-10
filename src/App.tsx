import React, { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import { InventoryItem, FilterState, TableState } from './types/inventory';

function App() {
  const [allData, setAllData] = useState<InventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    farmacia: [],
    departamento: [],
    marca: [],
    clasificacion: []
  });
  const [tableState, setTableState] = useState<TableState>({
    currentPage: 1,
    itemsPerPage: 50,
    sortColumn: null,
    sortDirection: 'asc'
  });

  const handleFilesProcessed = (data: InventoryItem[]) => {
    setAllData(data);
    // Reset filters when new data is loaded
    setFilters({
      farmacia: [],
      departamento: [],
      marca: [],
      clasificacion: []
    });
    setSearchTerm('');
    setTableState(prev => ({ ...prev, currentPage: 1 }));
  };

  const filteredData = useMemo(() => {
    let filtered = allData;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.codigo.toLowerCase().includes(searchLower) ||
        item.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Apply faceted filters
    if (filters.farmacia.length > 0) {
      filtered = filtered.filter(item => filters.farmacia.includes(item.farmacia));
    }
    if (filters.departamento.length > 0) {
      filtered = filtered.filter(item => filters.departamento.includes(item.departamento));
    }
    if (filters.marca.length > 0) {
      filtered = filtered.filter(item => filters.marca.includes(item.marca));
    }
    if (filters.clasificacion.length > 0) {
      filtered = filtered.filter(item => filters.clasificacion.includes(item.clasificacion));
    }

    return filtered;
  }, [allData, searchTerm, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Consolidador de Inventarios
              </h1>
              <p className="text-gray-600">
                Análisis y consolidación de inventarios farmacéuticos
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* File Upload Section */}
        <div className="mb-6">
          <FileUploader
            onFilesProcessed={handleFilesProcessed}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

        {/* Main Content Area */}
        {allData.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <div className="lg:flex-shrink-0">
              <FilterPanel
                data={allData}
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Search and Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <SearchBar
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {filteredData.length !== allData.length && (
                      <span>
                        {filteredData.length.toLocaleString()} de {allData.length.toLocaleString()} productos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <DataTable
                data={filteredData}
                tableState={tableState}
                onTableStateChange={setTableState}
              />
            </div>

            {/* Right Sidebar - Export */}
            <div className="lg:flex-shrink-0">
              <ExportButtons data={filteredData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;