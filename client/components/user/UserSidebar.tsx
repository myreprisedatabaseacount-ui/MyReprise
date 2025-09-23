"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  ShoppingBag,
  PackageSearch,
  BarChart3,
  Settings,
  HelpCircle,
  Store,
  Menu,
  X
} from 'lucide-react';
import { useUserDisplay, useUserPermissions } from '../../services/hooks/useCurrentUser';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: Home, label: 'Aperçu', href: '/user' },
  { id: 'profile', icon: User, label: 'Mon profil', href: '/user/profile' },
  { id: 'store', icon: Store, label: 'Gérer ma boutique', href: '/user/store' },
  { id: 'orders', icon: ShoppingBag, label: 'Mes commandes', href: '/user/orders' },
  { id: 'products', icon: PackageSearch, label: 'Mes produits', href: '/user/products' },
  { id: 'stats', icon: BarChart3, label: 'Statistiques', href: '/user/statistics' },
  { id: 'settings', icon: Settings, label: 'Paramètres', href: '/user/settings' },
  { id: 'help', icon: HelpCircle, label: 'Aide', href: '/user/help' },
];

export const UserSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { initials } = useUserDisplay();
  const { userRole } = useUserPermissions();

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const isActiveItem = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    if (href === '/user') {
      return pathWithoutLocale === '/user' || pathWithoutLocale === '' || pathWithoutLocale === '/';
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <div>
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-100 
          transition-all duration-300 ease-out z-50 overflow-hidden
          ${isMobile ? `${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-64` : `${isExpanded ? 'w-64' : 'w-16'}`}
        `}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveItem(item.href);
            return (
              <div key={item.id} className="relative group/item">
                <Link
                  href={item.href}
                  className={`
                    relative flex items-center px-3 py-3 rounded-lg transition-all duration-200 ease-out
                    ${active ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 flex-shrink-0 transition-colors duration-200
                      ${active ? 'text-blue-600' : 'text-gray-500 group-hover/item:text-gray-700'}
                    `}
                  />
                  <span
                    className={`
                      ml-3 font-medium transition-all duration-300 ease-out whitespace-nowrap
                    ${isMobile || isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                    `}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
};

export default UserSidebar;


