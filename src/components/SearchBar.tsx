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
        <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </div>
      
      <input
        type="text"
        placeholder="Buscar por código o nombre del producto..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="
          w-full pl-10 pr-10 py-2.5 
          border border-slate-300 bg-white text-slate-900 placeholder-slate-400 
          dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-500 
          rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
          transition-colors
        "
      />
      
      {searchTerm && (
        <button
          onClick={() => onSearchChange('')}
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center 
            text-slate-400 hover:text-slate-600 
            dark:text-slate-500 dark:hover:text-slate-300 
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