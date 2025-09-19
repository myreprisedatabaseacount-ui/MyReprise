"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { BarChart3, PackageSearch, ShoppingBag, Store, Settings } from 'lucide-react';

export default function UserOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Commandes</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Produits</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vues</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Revenus</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/user/store" className="group">
          <div className="p-5 rounded-lg border hover:border-blue-200 hover:shadow-md transition-all bg-white">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3"><Store className="w-5 h-5"/></div>
            <div className="font-semibold">Gérer ma boutique</div>
            <div className="text-sm text-gray-500">Paramètres de la boutique et vitrines</div>
          </div>
        </a>
        <a href="/user/orders" className="group">
          <div className="p-5 rounded-lg border hover:border-emerald-200 hover:shadow-md transition-all bg-white">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><ShoppingBag className="w-5 h-5"/></div>
            <div className="font-semibold">Mes commandes</div>
            <div className="text-sm text-gray-500">Suivi et gestion</div>
          </div>
        </a>
        <a href="/user/products" className="group">
          <div className="p-5 rounded-lg border hover:border-rose-200 hover:shadow-md transition-all bg-white">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3"><PackageSearch className="w-5 h-5"/></div>
            <div className="font-semibold">Mes produits</div>
            <div className="text-sm text-gray-500">Lister, ajouter et éditer</div>
          </div>
        </a>
        <a href="/user/statistics" className="group">
          <div className="p-5 rounded-lg border hover:border-violet-200 hover:shadow-md transition-all bg-white">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3"><BarChart3 className="w-5 h-5"/></div>
            <div className="font-semibold">Statistiques</div>
            <div className="text-sm text-gray-500">Ventes et performances</div>
          </div>
        </a>
        <a href="/user/settings" className="group">
          <div className="p-5 rounded-lg border hover:border-amber-200 hover:shadow-md transition-all bg-white">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3"><Settings className="w-5 h-5"/></div>
            <div className="font-semibold">Paramètres</div>
            <div className="text-sm text-gray-500">Sécurité et préférences</div>
          </div>
        </a>
      </div>
    </div>
  );
}


