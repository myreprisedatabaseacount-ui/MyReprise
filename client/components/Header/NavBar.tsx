'use client';

import React from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../services/hooks/useAuth';
import { useProduct } from '../../services/hooks/useProduct';

interface NavBarProps {
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({ className = '' }) => {
  const { openLogin } = useAuth();
  const { openCreateProduct } = useProduct();

  const handleLogin = () => {
    openLogin();
  };

  const handleCreateProduct = () => {
    openCreateProduct();
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCreateProduct}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer un produit
            </Button>
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
