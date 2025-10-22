import { useState, useMemo, useEffect } from 'react';
import { Moon, Sun, Filter, Settings, Menu, X, Briefcase, RefreshCw } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import MetricsDashboard from './components/MetricsDashboard';
import ClassificationSettings from './components/ClassificationSettings';
import ConfirmationDialog from './components/ConfirmationDialog';
import { InventoryItem, ConsolidatedInventoryItem, FilterState, TableState, ClassificationSettings as ClassificationSettingsType } from './types/inventory';
import { consolidateData } from './utils/consolidationLogic';
import { reprocessRawData } from './utils/fileProcessor';

const TextureBackground = () => (
  <div className="fixed inset-0 -z-50 opacity-20 dark:opacity-30" 
       style={{ 
         backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.95\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
       }} 
  />
);

const StarryNight = () => (
  <div className="fixed inset-0 -z-40 hidden dark:block">
    <div className="absolute inset-0 bg-transparent" 
         style={{ 
           backgroundImage: 'radial-gradient(white 0.5px, transparent 0)', 
           backgroundSize: '40px 40px', 
           opacity: 0.08 
         }}>
    </div>
  </div>
);

const CompactHeader = ({ 
  isDarkMode, 
  toggleTheme, 
  hasData, 
  onResetClick 
}: { 
  isDarkMode: boolean; 
  toggleTheme: () => void; 
  hasData: boolean; 
  onResetClick: () => void; 
}) => (
  <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
    <div className="max-w-full mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center space-x-3">
          <img src="/q2.png" alt="Logo" className="h-10 w-10 rounded-full border-2 border-blue-500"/>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Grupo Quirófanos Farmacias</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Análisis de Inventario</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasData && (
            <button
              onClick={onResetClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
                         bg-red-500 text-white hover:bg-red-600 
                         focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:block">Reiniciar</span>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  </header>
);

function App() {
  const [rawData, setRawData] = useState<InventoryItem[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedInventoryItem[]>([]);
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
  const [classificationSettings, setClassificationSettings] = useState<ClassificationSettingsType>({
    diasFalla: 20,
    diasExceso: 60,
    diasOK: { min: 20, max: 60 },
    periodos: [30, 40, 50, 60]
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const storedTheme = localStorage.getItem('theme');
    return storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [, setIsDashboardVisible] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleFilesProcessed = (processedRawData: InventoryItem[]) => {
    const finalConsolidatedData = consolidateData(processedRawData, classificationSettings);
    setRawData(processedRawData);
    setConsolidatedData(finalConsolidatedData);
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setSearchTerm('');
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
    setTimeout(() => setIsDashboardVisible(true), 100);
  };

  const handleSettingsChange = (newSettings: ClassificationSettingsType) => {
    setClassificationSettings(newSettings);
    if (rawData.length > 0) {
      const newRawData = reprocessRawData(rawData, newSettings);
      setRawData(newRawData);
      const reprocessedConsolidatedData = consolidateData(newRawData, newSettings);
      setConsolidatedData(reprocessedConsolidatedData);
    }
  };

  const confirmResetAndReload = () => {
    setRawData([]);
    setConsolidatedData([]);
    setSearchTerm('');
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
    setIsDashboardVisible(false);
    setIsResetConfirmOpen(false);
    setIsSidebarOpen(false);
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
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(searchLower) || 
        item.nombres.some(n => n.toLowerCase().includes(searchLower))
      );
    }

    if (filters.clasificacion.length > 0) {
      filtered = filtered.filter(item => filters.clasificacion.includes(item.clasificacion));
    }

    if (filters.departamento.length > 0) {
      filtered = filtered.filter(item => item.departamentos.some(d => filters.departamento.includes(d)));
    }

    if (filters.marca.length > 0) {
      filtered = filtered.filter(item => item.marcas.some(m => filters.marca.includes(m)));
    }

    return filtered;
  }, [consolidatedData, rawData, searchTerm, filters, classificationSettings]);

  useEffect(() => {
    setTableState(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, filters, tableState.itemsPerPage]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <TextureBackground />
      <StarryNight />

      <CompactHeader 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        hasData={consolidatedData.length > 0}
        onResetClick={() => setIsResetConfirmOpen(true)}
      />

      {consolidatedData.length === 0 ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl space-y-8">
            <FileUploader 
              onFilesProcessed={handleFilesProcessed} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              classificationSettings={classificationSettings} 
            />
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <button
                onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                className="w-full p-4 text-left font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
              >
                Configuración de Clasificación
                <Settings className={`h-5 w-5 transition-transform duration-300 ${isSettingsCollapsed ? '' : 'rotate-180'}`} />
              </button>
              
              {!isSettingsCollapsed && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                  <ClassificationSettings settings={classificationSettings} onSettingsChange={handleSettingsChange} />
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden sticky top-14 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
              >
                {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                {isSidebarOpen ? 'Cerrar Panel' : 'Filtros y Configuración'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Sidebar */}
            <aside className={`
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
              lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-30
              w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
              transition-transform duration-300 ease-in-out overflow-y-auto
            `}>
              <div className="p-4 space-y-4">
                {/* Quick Metrics */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <MetricsDashboard data={dataToDisplay} />
                </div>

                {/* Filters */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <button
                    onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                    className="w-full p-3 text-left font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={18} />
                      Filtros
                    </div>
                    <Settings className={`h-4 w-4 transition-transform duration-300 ${isFiltersCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                  
                  {!isFiltersCollapsed && (
                    <FilterPanel data={consolidatedData} filters={filters} onFilterChange={setFilters} />
                  )}
                </div>

                {/* Settings */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <button
                    onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                    className="w-full p-3 text-left font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Settings size={18} />
                      Configuración
                    </div>
                    <Settings className={`h-4 w-4 transition-transform duration-300 ${isSettingsCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                  
                  {!isSettingsCollapsed && (
                    <div className="p-3">
                      <ClassificationSettings settings={classificationSettings} onSettingsChange={handleSettingsChange} />
                    </div>
                  )}
                </div>

                {/* Export */}
                <ExportButtons rawData={rawData} settings={classificationSettings} consolidatedData={dataToDisplay} />
              </div>
            </aside>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Search and Controls Bar */}
              <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <strong>{dataToDisplay.length.toLocaleString()}</strong> productos
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Table - Full Height */}
              <div className="flex-1 bg-white dark:bg-slate-800">
                <DataTable 
                  data={dataToDisplay} 
                  tableState={tableState} 
                  onTableStateChange={setTableState} 
                  settings={classificationSettings} 
                />
              </div>
            </main>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmResetAndReload}
        title="¿Reiniciar y Borrar Datos?"
        message="Esta acción eliminará todos los datos cargados y reiniciará la aplicación. ¿Estás seguro?"
        confirmText="Sí, empezar de nuevo"
        cancelText="No, cancelar"
      />
    </div>
  );
}

export default App;