import { useState, useMemo, useEffect } from 'react';
// Se añade RefreshCw para el botón de reinicio
import { Moon, Sun, Filter, Settings, Search, ChevronDown, Briefcase, RefreshCw } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import ExportButtons from './components/ExportButtons';
import MetricsDashboard from './components/MetricsDashboard';
import ClassificationSettings from './components/ClassificationSettings';
import ConfirmationDialog from './components/ConfirmationDialog'; // <-- IMPORTADO
import { InventoryItem, ConsolidatedInventoryItem, FilterState, TableState, ClassificationSettings as ClassificationSettingsType } from './types/inventory';
import { consolidateData } from './utils/consolidationLogic';

// Componentes de la interfaz de usuario (fondos, pie de página)
const TextureBackground = () => (
  <div
    className="fixed inset-0 -z-50 opacity-30 dark:opacity-50"
    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.95\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
  />
);
const StarryNight = () => (
    <div className="fixed inset-0 -z-40 hidden dark:block">
        <div className="absolute inset-0 bg-transparent"
             style={{
                  backgroundImage: 'radial-gradient(white 0.5px, transparent 0)',
                  backgroundSize: '30px 30px',
                  opacity: 0.1
             }}>
        </div>
    </div>
);

const AppFooter = () => (
  <footer className="w-full border-t border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 mt-auto">
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        &copy; {new Date().getFullYear()} Quirófanos Farmacias. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);


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
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const storedTheme = localStorage.getItem('theme');
    return storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false); // <-- NUEVO ESTADO PARA EL DIÁLOGO

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
      const reprocessedData = consolidateData(rawData, newSettings);
      setConsolidatedData(reprocessedData);
    }
  };

  // Función que se llama cuando el usuario CONFIRMA el reinicio en el diálogo
  const confirmResetAndReload = () => {
    setRawData([]);
    setConsolidatedData([]);
    setSearchTerm('');
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
    setIsDashboardVisible(false);
    setIsResetConfirmOpen(false); // Cierra el diálogo después de confirmar
  };

  // Función que simplemente abre el diálogo de confirmación
  const handleOpenResetConfirm = () => {
    setIsResetConfirmOpen(true);
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
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <TextureBackground />
      <StarryNight />

      <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/q.jpeg" alt="Logo" className="h-12 w-12 rounded-full border-2 border-blue-500"/>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quirófanos Farmacias</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Análisis y consolidación</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {consolidatedData.length > 0 && (
                <button
                  onClick={handleOpenResetConfirm} // <-- AHORA ABRE EL DIÁLOGO
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg
                             bg-red-500 text-white hover:bg-red-600 
                             focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
                  aria-label="Empezar de nuevo y borrar datos"
                >
                  <RefreshCw className="h-4 w-4" />
                  Empezar de Nuevo
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {consolidatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-full max-w-3xl space-y-8">
              <FileUploader onFilesProcessed={handleFilesProcessed} isProcessing={isProcessing} setIsProcessing={setIsProcessing} classificationSettings={classificationSettings} />
              <details className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-1">
                <summary className="p-4 cursor-pointer font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200">
                  Configuración de Clasificación
                  <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                </summary>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                   <ClassificationSettings settings={classificationSettings} onSettingsChange={handleSettingsChange} />
                </div>
              </details>
            </div>
          </div>
        ) : (
          <div className={`transition-opacity duration-700 ${isDashboardVisible ? 'opacity-100' : 'opacity-0'} grid grid-cols-1 lg:grid-cols-12 gap-8`}>
            
            <aside className="lg:col-span-3">
              <div className="sticky top-24 space-y-6 h-[calc(100vh-7rem)] overflow-y-auto pr-4 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Filter size={20} />
                      Filtros
                    </h2>
                  </div>
                  <FilterPanel data={consolidatedData} filters={filters} onFilterChange={setFilters} />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
                    <Settings size={20} />
                    Ajustes
                  </h2>
                  <div className="p-4">
                     <ClassificationSettings settings={classificationSettings} onSettingsChange={handleSettingsChange} />
                  </div>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9 space-y-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-grow min-w-[250px] max-w-md">
                  <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                </div>
                <div className="flex items-center gap-4">
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                     <span className="font-bold text-slate-700 dark:text-slate-200">{dataToDisplay.length.toLocaleString()}</span> resultados
                   </p>
                   <ExportButtons data={dataToDisplay} rawData={rawData} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
                  <Briefcase size={20} />
                  Resumen del Inventario
                </h2>
                <div className="p-4">
                  <MetricsDashboard data={dataToDisplay} />
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
                 <DataTable data={dataToDisplay} tableState={tableState} onTableStateChange={setTableState} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- DIÁLOGO DE CONFIRMACIÓN PARA REINICIAR --- */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmResetAndReload}
        title="¿Reiniciar y Borrar Datos?"
        message="Esta acción eliminará todos los datos cargados y reiniciará la aplicación. ¿Estás seguro?"
        confirmText="Sí, empezar de nuevo"
        cancelText="No, cancelar"
      />

      <AppFooter />
    </div>
  );
}

export default App;