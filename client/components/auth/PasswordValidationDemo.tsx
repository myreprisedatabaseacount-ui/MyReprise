'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const PasswordValidationDemo: React.FC = () => {
  const passwordExamples = [
    { password: '1234567', valid: false, reason: 'Trop court (7 caractères)' },
    { password: 'password', valid: false, reason: 'Pas de chiffres' },
    { password: '12345678', valid: false, reason: 'Que des chiffres' },
    { password: 'password1', valid: true, reason: '8+ caractères avec chiffres' },
    { password: 'MyPass123', valid: true, reason: '8+ caractères avec chiffres' },
    { password: 'test1234', valid: true, reason: '8+ caractères avec chiffres' },
  ];

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Validation des mots de passe
      </h3>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Le mot de passe doit contenir au moins 8 caractères et au moins un chiffre
      </p>
      
      <div className="space-y-3">
        {passwordExamples.map((example, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {example.password}
              </code>
              <p className="text-xs text-gray-500 mt-1">{example.reason}</p>
            </div>
            <Badge variant={example.valid ? "default" : "destructive"}>
              {example.valid ? "Valide" : "Invalide"}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Règles de validation :</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>• Minimum 8 caractères</li>
          <li>• Au moins un chiffre (0-9)</li>
          <li>• Lettres et chiffres autorisés</li>
        </ul>
      </div>
    </Card>
  );
};

export default PasswordValidationDemo;
