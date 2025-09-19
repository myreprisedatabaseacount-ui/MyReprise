"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { useUserDisplay, useUserPermissions, useCurrentUser } from '../../../../services/hooks/useCurrentUser';
import { Store, ShoppingBag, BarChart3, Settings, PackageSearch, ShieldCheck } from 'lucide-react';

const QuickActionCard = ({
  title,
  description,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) => (
  <a href={href} className="group block">
    <Card className="transition-all duration-200 group-hover:shadow-md group-hover:border-blue-100">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-gray-800">{title}</div>
          <div className="text-sm text-gray-500 mt-1">{description}</div>
        </div>
      </CardContent>
    </Card>
  </a>
);

export default function ProfilePage() {
  const { displayName, email, formattedPhone, initials } = useUserDisplay();
  const { isVerified, userRole } = useUserPermissions();
  const { currentUser } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">{(initials || 'ME').slice(0, 2)}</span>
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">{displayName}</div>
            <div className="text-sm text-gray-500">{userRole || 'Utilisateur'} • {isVerified ? 'Compte vérifié' : 'Non vérifié'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/user/settings" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 h-10 py-2 px-4">Modifier le profil</a>
          <a href="/user/products/add" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">Ajouter un produit</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Nom</span><span className="font-medium text-gray-900">{displayName}</span></div>
            {email && <div className="flex justify-between text-gray-600"><span>Email</span><span className="font-medium text-gray-900">{email}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Téléphone</span><span className="font-medium text-gray-900">{formattedPhone || currentUser?.phone}</span></div>
            <div className="flex justify-between text-gray-600"><span>Rôle</span><span className="font-medium text-gray-900 capitalize">{userRole}</span></div>
            <div className="flex justify-between text-gray-600"><span>Statut</span><span className="font-medium text-gray-900 flex items-center gap-1">{isVerified ? <ShieldCheck className="w-4 h-4 text-green-600" /> : null}{isVerified ? 'Vérifié' : 'Non vérifié'}</span></div>
            <div className="flex justify-between text-gray-600"><span>Créé le</span><span className="font-medium text-gray-900">{currentUser ? new Date(currentUser.createdAt).toLocaleDateString() : '-'}</span></div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard title="Gérer ma boutique" description="Paramètres, vitrines et horaires" href="/user/store" icon={Store} accent="bg-blue-50 text-blue-600" />
          <QuickActionCard title="Mes commandes" description="Suivre et gérer vos achats" href="/user/orders" icon={ShoppingBag} accent="bg-emerald-50 text-emerald-600" />
          <QuickActionCard title="Statistiques" description="Ventes, vues et performances" href="/user/statistics" icon={BarChart3} accent="bg-violet-50 text-violet-600" />
          <QuickActionCard title="Paramètres" description="Sécurité, notifications, préférences" href="/user/settings" icon={Settings} accent="bg-amber-50 text-amber-600" />
          <QuickActionCard title="Mes produits" description="Lister, ajouter et éditer" href="/user/products" icon={PackageSearch} accent="bg-rose-50 text-rose-600" />
        </div>
      </div>
    </div>
  );
}


