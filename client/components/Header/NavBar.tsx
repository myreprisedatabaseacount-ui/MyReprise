'use client';

import React from 'react';
import { Button } from '../ui/button';

interface NavBarProps {
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({ className = '' }) => {
  const handleLogin = () => {
    console.log('Bouton Login cliqué');
  };

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              MyReprise
            </h1>
          </div>

          {/* Login Button */}
          <div className="flex items-center">
            <Button onClick={handleLogin}>
              Login
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
