"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, X, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useUserDisplay } from '../../services/hooks/useCurrentUser';

interface SearchItem {
  id: string;
  label: string;
  href: string;
}

const items: SearchItem[] = [
  { id: 'overview', label: 'Aperçu', href: '/user' },
  { id: 'profile', label: 'Mon profil', href: '/user/profile' },
  { id: 'store', label: 'Gérer ma boutique', href: '/user/store' },
  { id: 'orders', label: 'Mes commandes', href: '/user/orders' },
  { id: 'products', label: 'Mes produits', href: '/user/products' },
  { id: 'stats', label: 'Statistiques', href: '/user/statistics' },
  { id: 'settings', label: 'Paramètres', href: '/user/settings' },
  { id: 'help', label: 'Aide', href: '/user/help' },
];

export const UserTopBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { initials, displayName } = useUserDisplay();

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchRef.current) mobileSearchRef.current.focus();
  }, [isMobileSearchOpen]);

  const filteredResults = items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (date: Date) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
        <div className="h-full px-4 md:px-6 flex items-center justify-between md:ml-16 md:mr-16">
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <div className={`
                relative flex items-center bg-gray-50 rounded-xl transition-all duration-300 ease-out
                ${isSearchFocused ? 'ring-2 ring-blue-200 bg-white shadow-sm scale-105' : 'hover:bg-gray-100'}
              `}>
                <Search className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher dans mon espace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full px-3 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mr-3 p-1 hover:bg-gray-200 rounded-full transition-colors duration-200">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>

              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  {filteredResults.length > 0 ? (
                    <div className="py-2">
                      {filteredResults.map((result) => (
                        <Link key={result.id} href={result.href} className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200" onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}>
                          <span className="text-sm font-medium text-gray-700">{result.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 px-4 text-sm text-gray-500 text-center">Aucun résultat trouvé</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setIsMobileSearchOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(currentDate)}</span>
            </div>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 pl-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{(initials || 'ME').slice(0, 2)}</span>
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{displayName}</div>
                <div className="text-xs text-gray-500">Mon espace</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isMobileSearchOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setIsMobileSearchOpen(false)} />
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <div className="flex items-center bg-gray-50 rounded-xl">
                  <Search className="w-4 h-4 text-gray-400 ml-4" />
                  <input
                    ref={mobileSearchRef}
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              <button onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {searchQuery && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredResults.length > 0 ? (
                  <div className="py-2">
                    {filteredResults.map((result) => (
                      <Link key={result.id} href={result.href} className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200" onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}>
                        <span className="text-sm font-medium text-gray-700">{result.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 px-4 text-sm text-gray-500 text-center">Aucun résultat trouvé</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default UserTopBar;


