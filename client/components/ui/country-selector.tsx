'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import countriesData from '../../data/countries.json';

interface Country {
  name: string;
  code: string;
  emoji: string;
  unicode: string;
  image: string;
  dial_code: string;
}

interface CountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onCountrySelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(countriesData);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCountries(countriesData);
    } else {
      const filtered = countriesData.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dial_code.includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Country Button */}
      <Button
        type="button"
        variant="outline"
        onClick={toggleDropdown}
        className="flex items-center gap-2 h-11 px-3 bg-white/80 border-gray-100 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 min-w-[120px]  "
      >
        <img
          src={`https://country-code-au6g.vercel.app/${selectedCountry.image}`}
          alt={selectedCountry.name}
          className="w-5 h-4 object-cover rounded-sm"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const emojiSpan = target.nextElementSibling as HTMLSpanElement;
            if (emojiSpan) emojiSpan.style.display = 'inline';
          }}
        />
        <span className="text-lg hidden">{selectedCountry.emoji}</span>
        <span className="text-sm font-medium text-gray-700">
          {selectedCountry.dial_code}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

             {/* Dropdown */}
       {isOpen && (
         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden min-w-[300px]">
           {/* Search Input */}
           <div className="p-4 border-b border-gray-100">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
               <Input
                 ref={searchInputRef}
                 type="text"
                 placeholder="Rechercher un pays..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500"
               />
             </div>
           </div>

           {/* Countries List */}
           <div className="max-h-60 overflow-y-auto">
             {filteredCountries.length > 0 ? (
               filteredCountries.map((country) => (
                 <button
                   key={country.code}
                   type="button"
                   onClick={() => handleCountrySelect(country)}
                   className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                     selectedCountry.code === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                   }`}
                 >
                   <img
                     src={`https://country-code-au6g.vercel.app/${country.image}`}
                     alt={country.name}
                     className="w-6 h-5 object-cover rounded-sm flex-shrink-0"
                     onError={(e) => {
                       // Fallback to emoji if image fails to load
                       const target = e.target as HTMLImageElement;
                       target.style.display = 'none';
                       const emojiSpan = target.nextElementSibling as HTMLSpanElement;
                       if (emojiSpan) emojiSpan.style.display = 'inline';
                     }}
                   />
                   <span className="text-lg hidden">{country.emoji}</span>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-medium truncate">{country.name}</div>
                     <div className="text-xs text-gray-500">{country.code}</div>
                   </div>
                 </button>
               ))
             ) : (
               <div className="px-4 py-6 text-center text-gray-500 text-sm">
                 Aucun pays trouvé
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  );
};
