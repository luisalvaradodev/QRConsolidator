// src/App.tsx

import { useState, useMemo, useEffect } from 'react';
import { Activity, Moon, Sun } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import MetricsDashboard from './components/MetricsDashboard';
import { InventoryItem, ConsolidatedInventoryItem, FilterState, TableState } from './types/inventory';
import { consolidateData } from './utils/consolidationLogic';

function App() {
  const [rawData, setRawData] = useState<InventoryItem[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedInventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
  const [tableState, setTableState] = useState<TableState>({ currentPage: 1, itemsPerPage: 50, sortColumn: null, sortDirection: 'asc' });
  
  // Lógica del modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleFilesProcessed = (processedRawData: InventoryItem[]) => {
    const finalConsolidatedData = consolidateData(processedRawData);
    setRawData(processedRawData);
    setConsolidatedData(finalConsolidatedData);
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setSearchTerm('');
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
  };

  const dataToDisplay = useMemo(() => {
    let baseData: ConsolidatedInventoryItem[];
    const selectedFarmacies = filters.farmacia;

    if (selectedFarmacies.length === 1) {
      const farmacyName = selectedFarmacies[0];
      baseData = rawData
        .filter(item => item.farmacia === farmacyName)
        .map(item => ({
          ...item,
          nombres: [item.nombre],
          departamentos: [item.departamento],
          marcas: [item.marca],
          farmacias: [item.farmacia],
        }));
    } else if (selectedFarmacies.length > 1) {
      const filteredRawData = rawData.filter(item => selectedFarmacies.includes(item.farmacia));
      baseData = consolidateData(filteredRawData);
    } else {
      baseData = consolidatedData;
    }
    
    let filtered = baseData;
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => item.codigo.toLowerCase().includes(searchLower) || item.nombres.some(n => n.toLowerCase().includes(searchLower)));
    }
    if (filters.clasificacion.length > 0) filtered = filtered.filter(item => filters.clasificacion.includes(item.clasificacion));
    if (filters.departamento.length > 0) filtered = filtered.filter(item => item.departamentos.some(d => filters.departamento.includes(d)));
    if (filters.marca.length > 0) filtered = filtered.filter(item => item.marcas.some(m => filters.marca.includes(m)));

    return filtered;

  }, [consolidatedData, rawData, searchTerm, filters]);

  useMemo(() => {
    setTableState(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, filters, tableState.itemsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-gray-800/80 shadow-sm border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consolidador de Inventarios</h1>
                <p className="text-gray-600 dark:text-gray-400">Análisis y consolidación de inventarios farmacéuticos</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
            <FileUploader onFilesProcessed={handleFilesProcessed} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
        </div>
        
        {consolidatedData.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-80 lg:flex-shrink-0">
              <FilterPanel data={consolidatedData} filters={filters} onFilterChange={setFilters} />
            </aside>
            
            <div className="flex-1 space-y-6 min-w-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 max-w-lg">
                    <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                    {dataToDisplay.length.toLocaleString()} resultados
                  </div>
                </div>
              </div>
              
              <MetricsDashboard data={dataToDisplay} />

              <DataTable
                data={dataToDisplay}
                tableState={tableState}
                onTableStateChange={setTableState}
              />
            </div>
            
            <aside className="lg:w-64 lg:flex-shrink-0">
              <ExportButtons data={dataToDisplay} />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;