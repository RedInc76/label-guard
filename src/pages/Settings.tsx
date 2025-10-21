import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, History, Star, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

export const Settings = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  const settingsOptions = [
    {
      icon: User,
      label: 'Perfiles',
      description: 'Gestiona los perfiles de usuarios',
      path: '/profile',
      showAlways: true,
    },
    {
      icon: History,
      label: 'Historial',
      description: 'Consulta tu historial de escaneos',
      path: '/history',
      showAlways: false,
      badge: 'Premium',
    },
    {
      icon: Star,
      label: 'Favoritos',
      description: 'Tus productos favoritos guardados',
      path: '/favorites',
      showAlways: false,
      badge: 'Premium',
    },
    {
      icon: Lock,
      label: 'Permisos',
      description: 'Gestiona permisos de cámara y ubicación',
      path: '/permissions',
      showAlways: false,
      onlyNative: true,
      badge: 'Móvil',
    },
  ];

  const visibleOptions = settingsOptions.filter(
    (option) =>
      (option.showAlways || isPremium) &&
      (!option.onlyNative || isNative)
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona todas las opciones de la aplicación
          </p>
        </div>

        {/* Settings Options */}
        <div className="space-y-3">
          {visibleOptions.map((option) => (
            <Card
              key={option.path}
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(option.path)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <option.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {option.label}
                    </h3>
                    {option.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        {!isPremium && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              Algunas opciones requieren una cuenta Premium
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
