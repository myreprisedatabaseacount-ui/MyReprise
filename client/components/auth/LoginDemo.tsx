'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const LoginDemo: React.FC = () => {
  const loginFeatures = [
    { feature: 'Numéro de téléphone', description: 'Avec sélecteur de pays (+212 par défaut)', status: 'active' },
    { feature: 'Mot de passe', description: 'Sans format fixe, validation simple', status: 'active' },
    { feature: 'Validation en temps réel', description: 'Erreurs affichées au blur ou submit', status: 'active' },
    { feature: 'Connexion sociale', description: 'Google et Facebook', status: 'active' },
    { feature: 'Mot de passe oublié', description: 'Lien vers réinitialisation', status: 'active' },
    { feature: 'OTP', description: 'Supprimé du processus de connexion', status: 'removed' },
  ];

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Processus de Connexion
      </h3>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Connexion simplifiée avec numéro de téléphone et mot de passe
      </p>
      
      <div className="space-y-3">
        {loginFeatures.map((feature, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{feature.feature}</h4>
              <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
            </div>
            <Badge 
              variant={
                feature.status === 'active' ? "default" : 
                feature.status === 'removed' ? "destructive" : 
                "secondary"
              }
            >
              {feature.status === 'active' ? "Actif" : 
               feature.status === 'removed' ? "Supprimé" : 
               "Inactif"}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>Améliorations :</strong>
        </p>
        <ul className="text-xs text-green-700 mt-2 space-y-1">
          <li>• Processus de connexion simplifié</li>
          <li>• Pas d'OTP requis</li>
          <li>• Validation intelligente des erreurs</li>
          <li>• Interface utilisateur optimisée</li>
        </ul>
      </div>
    </Card>
  );
};

export default LoginDemo;
