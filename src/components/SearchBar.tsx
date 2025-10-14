import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {/* Ícono de búsqueda con color adaptable */}
        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <input
        type="text"
        placeholder="Buscar por código o nombre del producto..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        // Campo de texto con estilos para ambos temas
        className="
          w-full pl-10 pr-10 py-2.5 
          border border-gray-300 bg-white text-gray-900 placeholder-gray-400 
          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 
          rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
          transition-colors
        "
      />
      
      {searchTerm && (
        <button
          onClick={() => onSearchChange('')}
          // Botón de limpiar con colores adaptables
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center 
            text-gray-400 hover:text-gray-600 
            dark:text-gray-500 dark:hover:text-gray-300 
            transition-colors
          "
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;