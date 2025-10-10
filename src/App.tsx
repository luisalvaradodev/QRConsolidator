import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import { InventoryItem, ConsolidatedInventoryItem, FilterState, TableState } from './types/inventory';
import { consolidateData } from './utils/consolidationLogic';

function App() {
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedInventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
  const [tableState, setTableState] = useState<TableState>({ currentPage: 1, itemsPerPage: 50, sortColumn: null, sortDirection: 'asc' });

  const handleFilesProcessed = (rawData: InventoryItem[]) => {
    const finalData = consolidateData(rawData);
    setConsolidatedData(finalData);
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setSearchTerm('');
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
  };

  const filteredData = useMemo(() => {
    let filtered = consolidatedData;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => item.codigo.toLowerCase().includes(searchLower) || item.nombres.some(n => n.toLowerCase().includes(searchLower)));
    }
    if (filters.clasificacion.length > 0) filtered = filtered.filter(item => filters.clasificacion.includes(item.clasificacion));
    if (filters.departamento.length > 0) filtered = filtered.filter(item => item.departamentos.some(d => filters.departamento.includes(d)));
    if (filters.marca.length > 0) filtered = filtered.filter(item => item.marcas.some(m => filters.marca.includes(m)));
    if (filters.farmacia.length > 0) filtered = filtered.filter(item => item.farmacias.some(f => filters.farmacia.includes(f)));
    return filtered;
  }, [consolidatedData, searchTerm, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Consolidador de Inventarios</h1>
              <p className="text-gray-600">Análisis y consolidación de inventarios farmacéuticos</p>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6"><FileUploader onFilesProcessed={handleFilesProcessed} isProcessing={isProcessing} setIsProcessing={setIsProcessing} /></div>
        {consolidatedData.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80 lg:flex-shrink-0"><FilterPanel data={consolidatedData} filters={filters} onFilterChange={setFilters} /></div>
            <div className="flex-1 space-y-6 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 max-w-md"><SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} /></div>
                  <div className="text-sm text-gray-600">{filteredData.length.toLocaleString()} de {consolidatedData.length.toLocaleString()} productos</div>
                </div>
              </div>
              <DataTable data={filteredData} tableState={tableState} onTableStateChange={setTableState} />
            </div>
            <div className="lg:w-64 lg:flex-shrink-0"><ExportButtons data={filteredData} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;