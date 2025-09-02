import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  BarChart3,
  Users,
  Settings,
  FileText,
  Calendar,
  Bell,
  HelpCircle,
  Menu,
  X,
  FolderOpen
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/back-office' },
  { id: 'categories', icon: FolderOpen, label: 'Catégories', href: '/back-office/categories' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', href: '/back-office/analytics' },
  { id: 'users', icon: Users, label: 'Utilisateurs', href: '/back-office/users' },
  { id: 'documents', icon: FileText, label: 'Documents', href: '/back-office/documents' },
  { id: 'calendar', icon: Calendar, label: 'Calendrier', href: '/back-office/calendar' },
  { id: 'notifications', icon: Bell, label: 'Notifications', href: '/back-office/notifications' },
  { id: 'settings', icon: Settings, label: 'Paramètres', href: '/back-office/settings' },
  { id: 'help', icon: HelpCircle, label: 'Aide', href: '/back-office/help' },
];

interface SidebarProps {
  activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'dashboard' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fonction pour déterminer si un élément est actif basé sur l'URL
  const isActiveItem = (href: string) => {
    // Debug temporaire
    console.log('Checking URL:', pathname, 'against href:', href);
    
    // Extraire la partie après la langue (ex: /fr/back-office/categories -> /back-office/categories)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    console.log('Path without locale:', pathWithoutLocale);
    
    if (href === '/back-office') {
      return pathWithoutLocale === '/back-office' || pathWithoutLocale === '' || pathWithoutLocale === '/';
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-100 
          transition-all duration-300 ease-out z-50 group
          ${isMobile ? 
            `${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-64` : 
            `${isExpanded ? 'w-64' : 'w-16'} hover:w-64`
          }
        `}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Logo Area */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span 
              className={`
                font-semibold text-gray-800 transition-all duration-300 ease-out
                ${isMobile || isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0'}
              `}
            >
              Dashboard
            </span>
          </div>
        </div>

                 {/* Navigation */}
         <nav className="p-2 space-y-1">
           {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = isActiveItem(item.href);
             
             return (
               <div key={item.id} className="relative group/item">
                 <Link
                   href={item.href}
                   className={`
                     relative flex items-center px-3 py-3 rounded-lg transition-all duration-200 ease-out
                     ${isActive 
                       ? 'bg-blue-50 text-blue-600 shadow-sm' 
                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                     }
                   `}
                 >
                  <Icon 
                    className={`
                      w-5 h-5 flex-shrink-0 transition-colors duration-200
                      ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover/item:text-gray-700'}
                    `} 
                  />
                  <span 
                    className={`
                      ml-3 font-medium transition-all duration-300 ease-out whitespace-nowrap
                      ${isMobile || isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0'}
                    `}
                  >
                    {item.label}
                  </span>

                                     {/* Active indicator */}
                   {isActive && (
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                   )}
                 </Link>

                {/* Tooltip for collapsed state */}
                {!isMobile && !isExpanded && (
                  <div className="
                    absolute left-full ml-2 top-1/2 -translate-y-1/2 
                    bg-gray-800 text-white text-sm py-1 px-3 rounded-lg 
                    opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible
                    transition-all duration-200 ease-out delay-300
                    pointer-events-none z-50 whitespace-nowrap
                    before:content-[''] before:absolute before:left-[-4px] before:top-1/2 before:-translate-y-1/2
                    before:border-4 before:border-transparent before:border-r-gray-800
                  ">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex-shrink-0"></div>
            <div 
              className={`
                transition-all duration-300 ease-out
                ${isMobile || isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0'}
              `}
            >
              <div className="text-sm font-medium text-gray-800">John Doe</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};