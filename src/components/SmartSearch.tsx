'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

interface AutocompleteResult {
  suggestions: string[];
  categories: string[];
  brands: string[];
}

interface SmartSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  placeholder = "Search for HVAC products...",
  className = "",
  isMobile = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState([
    'Air Conditioner',
    'Split AC',
    'Window AC',
    'Ventilation Fan',
    'HVAC Parts'
  ]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };
  
  // Debounced autocomplete fetch
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions(null);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&autocomplete=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsLoading(true);
    fetchSuggestions(value);
  };
  
  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    saveRecentSearch(searchQuery.trim());
    setIsOpen(false);
    setQuery(searchQuery);
    
    if (onSearch) {
      onSearch(searchQuery.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    setSuggestions(null);
    inputRef.current?.focus();
  };
  
  const showDropdown = isOpen && (suggestions || recentSearches.length > 0 || query.length === 0);
  
  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary focus:border-transparent
              bg-white text-gray-900 placeholder-gray-500
              ${isMobile ? 'text-sm' : 'text-base'}
              transition-all duration-200
            `}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      
      {/* Dropdown */}
      {showDropdown && (
        <div className={`
          absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50
          max-h-96 overflow-y-auto
          ${isMobile ? 'max-w-screen' : ''}
        `}>
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions && !isLoading && (
            <>
              {suggestions.suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                    Products
                  </div>
                  {suggestions.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {suggestions.categories.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                    Categories
                  </div>
                  {suggestions.categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(category)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <div className="h-4 w-4 bg-primary/10 rounded flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded"></div>
                      </div>
                      <span className="text-gray-900">{category}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {suggestions.brands.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                    Brands
                  </div>
                  {suggestions.brands.map((brand, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(brand)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                        <div className="h-2 w-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-gray-900">{brand}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Recent searches */}
          {!suggestions && !isLoading && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{search}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Popular searches */}
          {!suggestions && !isLoading && query.length === 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                Popular Searches
              </div>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{search}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* No results */}
          {suggestions && !isLoading && 
           suggestions.suggestions.length === 0 && 
           suggestions.categories.length === 0 && 
           suggestions.brands.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No suggestions found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;