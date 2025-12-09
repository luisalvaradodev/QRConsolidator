import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative group">
      {/* Icono de búsqueda */}
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      
      {/* Input */}
      <input
        type="text"
        placeholder="Buscar código o nombre..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="
          w-full pl-9 pr-8 py-1.5 
          bg-slate-100 dark:bg-slate-800 
          border border-transparent focus:bg-white dark:focus:bg-slate-900
          border-slate-200 dark:border-slate-700
          text-slate-900 dark:text-slate-100 placeholder-slate-500 
          rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          transition-all
        "
      />
      
      {/* Botón de limpiar (X) */}
      {searchTerm && (
        <button 
          onClick={() => onSearchChange('')} 
          className="
            absolute inset-y-0 right-0 pr-2 flex items-center 
            text-slate-400 hover:text-slate-600 
            dark:text-slate-500 dark:hover:text-slate-300
            transition-colors
          "
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;