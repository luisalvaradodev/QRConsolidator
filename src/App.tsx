import { useState, useMemo, useEffect } from 'react';
import { Moon, Sun, Settings, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

// --- COMPONENTS VISUALES ---

const TextureBackground = () => (
  <div className="fixed inset-0 -z-50 opacity-20 dark:opacity-30 pointer-events-none" 
       style={{ 
         backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.95\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
       }} 
  />
);

const StarryNight = () => (
  <div className="fixed inset-0 -z-40 hidden dark:block pointer-events-none">
    <div className="absolute inset-0 bg-transparent" 
         style={{ 
           backgroundImage: 'radial-gradient(white 0.5px, transparent 0)', 
           backgroundSize: '40px 40px', 
           opacity: 0.08 
         }}>
    </div>
  </div>
);

// --- HEADER COMPACTO ---

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  hasData: boolean;
  onResetClick: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const CompactHeader = ({ 
  isDarkMode, 
  toggleTheme, 
  hasData, 
  onResetClick, 
  isSidebarOpen, 
  toggleSidebar 
}: HeaderProps) => (
  <header className="h-10 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between px-4 select-none shrink-0 z-50 transition-colors duration-300">
    <div className="flex items-center gap-3">
      {hasData && (
        <button 
          onClick={toggleSidebar} 
          className="text-slate-500 hover:text-blue-500 transition-colors focus:outline-none"
          title={isSidebarOpen ? "Cerrar panel lateral" : "Abrir panel lateral"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      )}
      <div className="flex items-center gap-2">
        <img src="/q2.png" alt="Logo" className="h-6 w-6 rounded-full border border-slate-300"/>
        <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          GRUPO QUIRÓFANOS <span className="font-normal text-slate-500">| Inventario</span>
        </h1>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {hasData && (
        <button 
          onClick={onResetClick} 
          className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 focus:outline-none transition-colors"
        >
          <RefreshCw size={14} /> Reiniciar
        </button>
      )}
      <button 
        onClick={toggleTheme} 
        className="text-slate-500 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors focus:outline-none"
      >
        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  </header>
);

// --- APP MAIN ---

function App() {
  // 1. Estados de Datos
  const [rawData, setRawData] = useState<InventoryItem[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedInventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 2. Estados de Filtros y Tablas
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
    sortColumn: 'clasificacion', 
    sortDirection: 'asc' 
  });
  const [classificationSettings, setClassificationSettings] = useState<ClassificationSettingsType>({
    diasFalla: 20,
    diasExceso: 60,
    diasOK: { min: 20, max: 60 },
    periodos: [30, 40, 50, 60]
  });

  // 3. Estados de UI / Layout
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const storedTheme = localStorage.getItem('theme');
    return storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'filters' | 'settings'>('filters');

  // Efecto para el tema Dark/Light
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Lógica de procesamiento de archivos
  const handleFilesProcessed = (processedRawData: InventoryItem[]) => {
    const finalConsolidatedData = consolidateData(processedRawData, classificationSettings);
    setRawData(processedRawData);
    setConsolidatedData(finalConsolidatedData);
    
    // Resetear estados al cargar nueva data
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setTableState({ currentPage: 1, itemsPerPage: 50, sortColumn: 'clasificacion', sortDirection: 'asc' });
    // Asegurar que el sidebar esté abierto al cargar data
    setIsSidebarOpen(true);
  };

  // Lógica de cambio de configuración
  const handleSettingsChange = (newSettings: ClassificationSettingsType) => {
    setClassificationSettings(newSettings);
    if (rawData.length > 0) {
      const newRawData = reprocessRawData(rawData, newSettings);
      setRawData(newRawData);
      setConsolidatedData(consolidateData(newRawData, newSettings));
    }
  };

  // Lógica de reseteo
  const confirmResetAndReload = () => {
    setRawData([]);
    setConsolidatedData([]);
    setSearchTerm('');
    setFilters({ farmacia: [], departamento: [], marca: [], clasificacion: [] });
    setIsResetConfirmOpen(false);
  };

  // Lógica de filtrado (Memoized)
  const dataToDisplay = useMemo(() => {
    let baseData: ConsolidatedInventoryItem[];
    const selectedFarmacies = filters.farmacia;

    // Filtrado inicial por farmacia
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
           existenciasPorFarmacia: { [item.farmacia]: item.existenciaActual } 
         }));
    } else if (selectedFarmacies.length > 1) {
       const filteredRawData = rawData.filter(item => selectedFarmacies.includes(item.farmacia));
       baseData = consolidateData(filteredRawData, classificationSettings);
    } else {
       baseData = consolidatedData;
    }

    let filtered = baseData;

    // Búsqueda global
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(searchLower) || 
        item.nombres.some(n => n.toLowerCase().includes(searchLower))
      );
    }

    // Filtros específicos
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

  // Resetear paginación al filtrar
  useEffect(() => { 
    setTableState(prev => ({ ...prev, currentPage: 1 })); 
  }, [searchTerm, filters]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      <TextureBackground />
      <StarryNight />

      <CompactHeader 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        hasData={consolidatedData.length > 0} 
        onResetClick={() => setIsResetConfirmOpen(true)}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {consolidatedData.length === 0 ? (
        // --- VISTA DE CARGA INICIAL (Upload) ---
        <main className="flex-1 overflow-auto flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-6">
            
            <FileUploader 
              onFilesProcessed={handleFilesProcessed} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              classificationSettings={classificationSettings} 
            />
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings size={18}/> Configuración Inicial
                </h3>
                <ClassificationSettings 
                  settings={classificationSettings} 
                  onSettingsChange={handleSettingsChange} 
                />
            </div>
          </div>
        </main>
      ) : (
        // --- VISTA DASHBOARD PRINCIPAL ---
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: Ancho fijo o cero para animación */}
          <aside className={`
             ${isSidebarOpen ? 'w-72 border-r' : 'w-0'} 
             bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700
             flex flex-col transition-all duration-300 ease-in-out relative
          `}>
            {/* Pestañas del Sidebar */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
               <button 
                 onClick={() => setActiveTab('filters')} 
                 className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors
                   ${activeTab === 'filters' 
                     ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-2 border-blue-500' 
                     : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                 Filtros
               </button>
               <button 
                 onClick={() => setActiveTab('settings')} 
                 className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors
                   ${activeTab === 'settings' 
                     ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-2 border-blue-500' 
                     : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                 Ajustes
               </button>
            </div>
            
            {/* Contenido del Sidebar con Scroll */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
               {activeTab === 'filters' ? (
                  <FilterPanel 
                    data={consolidatedData} 
                    filters={filters} 
                    onFilterChange={setFilters} 
                  />
               ) : (
                  <div className="space-y-6">
                     <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <ClassificationSettings 
                          settings={classificationSettings} 
                          onSettingsChange={handleSettingsChange} 
                        />
                     </div>
                     <ExportButtons 
                       rawData={rawData} 
                       settings={classificationSettings} 
                     />
                  </div>
               )}
            </div>
          </aside>

          {/* ÁREA PRINCIPAL DE DATOS */}
          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
             
             {/* Toolbar Superior: Búsqueda y Contador */}
             <div className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-slate-900 shrink-0">
                <div className="w-full max-w-md">
                   <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                </div>
                <div className="flex items-center gap-4 pl-4">
                   <span className="text-xs text-slate-500 whitespace-nowrap">
                      Viendo <strong className="text-slate-800 dark:text-slate-200">{dataToDisplay.length.toLocaleString()}</strong> resultados
                   </span>
                </div>
             </div>

             {/* Ticker de Métricas */}
             <div className="shrink-0 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                <MetricsDashboard data={dataToDisplay} />
             </div>

             {/* Tabla: Llena el espacio restante */}
             <div className="flex-1 overflow-hidden relative">
                <DataTable 
                  data={dataToDisplay} 
                  tableState={tableState} 
                  onTableStateChange={setTableState} 
                  settings={classificationSettings} 
                />
             </div>
          </main>
        </div>
      )}

      <ConfirmationDialog 
        isOpen={isResetConfirmOpen} 
        onClose={() => setIsResetConfirmOpen(false)} 
        onConfirm={confirmResetAndReload} 
        title="¿Reiniciar análisis?" 
        message="Se perderán los datos actuales cargados en memoria. ¿Deseas continuar?" 
        confirmText="Sí, reiniciar"
        cancelText="Cancelar"
      />
    </div>
  );
}

export default App;