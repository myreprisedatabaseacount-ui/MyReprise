import React from 'react';
import { useCurrentUser, useUserPermissions, useUserDisplay } from '../services/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading, error, refreshUser, logout } = useCurrentUser();
  const { isAdmin, isModerator, isVerified, userRole } = useUserPermissions();
  const { fullName, initials, displayName, formattedPhone, email } = useUserDisplay();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={refreshUser} variant="outline" size="sm">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2" />
            <p>Non connecté</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-blue-600">{initials}</span>
        </div>
        <CardTitle className="text-xl">{displayName}</CardTitle>
        <div className="flex justify-center gap-2 mt-2">
          <Badge variant={isVerified ? "default" : "secondary"}>
            {isVerified ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Vérifié
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Non vérifié
              </>
            )}
          </Badge>
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            {userRole}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Nom complet:</span>
            <span className="ml-auto font-medium">{fullName}</span>
          </div>
          
          {email && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Email:</span>
              <span className="ml-auto font-medium">{email}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Téléphone:</span>
            <span className="ml-auto font-medium">{formattedPhone}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Rôle:</span>
            <span className="ml-auto font-medium capitalize">{userRole}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button onClick={refreshUser} variant="outline" size="sm" className="flex-1">
              Actualiser
            </Button>
            <Button onClick={logout} variant="destructive" size="sm" className="flex-1">
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Informations de debug (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-4 border-t">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfile;
