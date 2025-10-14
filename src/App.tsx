import { useState, useMemo, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import MetricsDashboard from './components/MetricsDashboard';
import ClassificationSettings from './components/ClassificationSettings';
import { InventoryItem, ConsolidatedInventoryItem, FilterState, TableState, ClassificationSettings as ClassificationSettingsType } from './types/inventory';
import { consolidateData } from './utils/consolidationLogic';

function App() {
  const [rawData, setRawData] = useState<InventoryItem[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedInventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
  const [tableState, setTableState] = useState<TableState>({ currentPage: 1, itemsPerPage: 50, sortColumn: null, sortDirection: 'asc' });
  const [classificationSettings, setClassificationSettings] = useState<ClassificationSettingsType>({
    diasFalla: 20,
    diasExceso: 60,
    diasOK: { min: 20, max: 60 }
  });
  
  // La inicialización del estado del tema está correcta
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default a oscuro si window no está definido (SSR)
  });

  // --- INICIO DE LA CORRECCIÓN ---

  // 1. Corrige el useEffect para manejar ambos estados (claro y oscuro)
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

  // --- FIN DE LA CORRECCIÓN ---

  const handleFilesProcessed = (processedRawData: InventoryItem[]) => {
    const finalConsolidatedData = consolidateData(processedRawData, classificationSettings);
    setRawData(processedRawData);
    setConsolidatedData(finalConsolidatedData);
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setSearchTerm('');
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
  };

  const handleSettingsChange = (newSettings: ClassificationSettingsType) => {
    setClassificationSettings(newSettings);
    if (rawData.length > 0) {
      const reprocessedData = consolidateData(rawData, newSettings);
      setConsolidatedData(reprocessedData);
    }
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
          existenciasPorFarmacia: { [item.farmacia]: item.existenciaActual },
        }));
    } else if (selectedFarmacies.length > 1) {
      const filteredRawData = rawData.filter(item => selectedFarmacies.includes(item.farmacia));
      baseData = consolidateData(filteredRawData, classificationSettings);
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

  }, [consolidatedData, rawData, searchTerm, filters, classificationSettings]);

  useMemo(() => {
    setTableState(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, filters, tableState.itemsPerPage]);

  return (
    // 2. Usa clases dinámicas para el tema en el div principal
    <div className="min-h-screen bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-100 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-blue-500/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/q.jpeg" 
                alt="Logo Quirófanos Farmacias" 
                className="h-14 w-14 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quirófanos Farmacias</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Análisis y consolidación farmacéutica</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* El resto del código no necesita cambios significativos de tema si usa clases dark: */}
        <div className="space-y-4">
          <FileUploader 
            onFilesProcessed={handleFilesProcessed} 
            isProcessing={isProcessing} 
            setIsProcessing={setIsProcessing}
            classificationSettings={classificationSettings}
          />
          
          <ClassificationSettings 
            settings={classificationSettings}
            onSettingsChange={handleSettingsChange}
          />
        </div>

        {consolidatedData.length > 0 && (
          <div className="mt-6 grid grid-cols-12 gap-4">
            <aside className="col-span-12 lg:col-span-3">
              <FilterPanel data={consolidatedData} filters={filters} onFilterChange={setFilters} />
            </aside>
            
            <div className="col-span-12 lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-500/30 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex-1 max-w-md">
                    <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                    {dataToDisplay.length.toLocaleString()} productos
                  </div>
                </div>
                
                <MetricsDashboard data={dataToDisplay} />
              </div>

              <DataTable
                data={dataToDisplay}
                tableState={tableState}
                onTableStateChange={setTableState}
              />
            </div>
            
            <aside className="col-span-12 lg:col-span-2">
              <ExportButtons data={dataToDisplay} rawData={rawData} />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;